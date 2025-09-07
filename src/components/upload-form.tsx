
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { addKeepsake } from "@/actions/memories";
import type { Event } from "@/lib/types";
import { logger } from "@/lib/logger";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Clapperboard, FileText, Send, GalleryHorizontal } from "lucide-react";

const formSchema = z
  .object({
    keepsakeType: z.enum(["photo", "video", "text"]),
    caption: z.string().max(500, "Caption is too long.").optional(),
    name: z.string().max(50, "Name is too long.").optional(),
    consent: z.boolean(),
    text: z.string().optional(),
    files: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.keepsakeType === "photo" && (!data.files || data.files.length === 0)) {
        return false;
      }
      if (data.keepsakeType === "video" && (!data.files || data.files.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a file to upload.",
      path: ["files"],
    }
  )
  .refine(
    (data) => {
        // This will be validated in the component with the actual event data
        return true;
    },
    {
        message: "You can upload a maximum of 10 photos.",
        path: ["files"],
    }
  )
  .refine(
    (data) => {
      if (data.keepsakeType === "text" && (!data.text || data.text.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Please write a message.",
      path: ["text"],
    }
  );


type UploadFormValues = z.infer<typeof formSchema>;
type SerializableEvent = Omit<Event, "createdAt"> & { createdAt: string };

export default function UploadForm({ event }: { event: SerializableEvent }) {
  // Helper function to count enabled types (excluding gallery since it's handled under photo)
  const getEnabledTypesCount = () => {
    const enabledTypes = event.enabledKeepsakeTypes || { photo: true, video: true, text: true, gallery: true };
    let count = 0;
    if (enabledTypes.photo !== false) count++;
    if (enabledTypes.video !== false) count++;
    if (enabledTypes.text !== false) count++;
    return count;
  };

  // Helper function to get grid class based on enabled types count
  const getGridClass = () => {
    const count = getEnabledTypesCount();
    switch (count) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      default: return 'grid-cols-3';
    }
  };

  // Set initial keepsake type to first enabled type
  const getInitialKeepsakeType = () => {
    const enabledTypes = event.enabledKeepsakeTypes || { photo: true, video: true, text: true, gallery: true };
    if (enabledTypes.photo) return "photo";
    if (enabledTypes.video) return "video";
    if (enabledTypes.text) return "text";
    return "photo"; // fallback
  };

  const [keepsakeType, setKeepsakeType] = useState<"photo" | "video" | "text">(getInitialKeepsakeType());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadLog, setUploadLog] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  // Log when user visits upload page
  useEffect(() => {
    logger.guestVisitedUploadPage(event.slug, event.id).catch(console.error);
  }, [event.slug, event.id]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        keepsakeType: "photo",
        consent: !event.consentRequired, 
        name: "", 
        caption: "", 
        text: "" 
    },
  });

  // Watch for consent changes to log when consent is given
  const watchedConsent = watch("consent");
  const watchedName = watch("name");
  
  useEffect(() => {
    if (watchedConsent && event.consentRequired) {
      logger.guestConsentGiven(event.slug, event.id, watchedName).catch(console.error);
    }
  }, [watchedConsent, event.consentRequired, event.slug, event.id, watchedName]);


  
  const handleKeepsakeTypeChange = (value: "photo" | "video" | "text") => {
      setKeepsakeType(value);
      setValue("keepsakeType", value);
  }

  const handleFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploadLog(`Starting upload for ${file.name}...`);
      
      // Optimize file name and path for better caching
      const timestamp = Date.now();
      const optimizedName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, `keepsakes/${event.id}/${optimizedName}`);
      
      // Set metadata for better caching and CDN optimization
      const metadata = {
        cacheControl: 'public, max-age=31536000', // 1 year cache
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: timestamp.toString(),
          eventId: event.id
        }
      };
      
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          setUploadLog(`Upload is ${progress.toFixed(2)}% done`);
        },
        (error) => {
          console.error("Upload failed:", error);
          setUploadLog(`Upload failed: ${error.message}. Check storage rules and CORS settings.`);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadLog(`Upload complete for ${file.name}!`);
          resolve(downloadURL);
        }
      );
    });
  };

  const onSubmit = async (data: UploadFormValues) => {
    setIsSubmitting(true);
    setUploadLog("Form submitted. Processing...");

    // Validate consent if required
    if (event.consentRequired && !data.consent) {
      toast({ 
        title: "Consent required", 
        description: "You must agree to the terms before uploading.", 
        variant: "destructive" 
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let keepsakeData: any = {
        type: data.keepsakeType,
        caption: data.caption,
        name: data.name,
      };

      if (data.keepsakeType === 'photo' && data.files) {
        const files = Array.from(data.files as FileList);
        
        // Validate gallery size limit
        if (files.length > 1 && files.length > (event.gallerySizeLimit || 10)) {
          toast({ 
            title: "Too many photos", 
            description: `You can only upload up to ${event.gallerySizeLimit || 10} photos in a gallery.`, 
            variant: "destructive" 
          });
          setIsSubmitting(false);
          return;
        }
        
        if (files.length > 1) {
            keepsakeData.type = 'gallery';
        }
        const fileUrls = [];
        for (const file of files) {
          const url = await handleFileUpload(file);
          fileUrls.push(url);
        }
        keepsakeData.fileUrls = fileUrls;
      } else if (data.keepsakeType === 'video' && data.files) {
        const file = (data.files as FileList)[0];
        keepsakeData.fileUrl = await handleFileUpload(file);
      } else if (data.keepsakeType === 'text') {
        keepsakeData.text = data.text;
      }

      setUploadLog("Adding keepsake to database...");
      const result = await addKeepsake(event.id, event.slug, keepsakeData);

      if (result.success) {
        setUploadLog("Keepsake added successfully!");
        toast({ title: "Keepsake uploaded!", description: "Thank you for sharing." });
        router.push(`/thanks?eventId=${event.id}&eventSlug=${event.slug}`);
      } else {
        throw new Error(result.error || "Failed to add keepsake");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setUploadLog(`Error: ${errorMessage}`);
      toast({ title: "Upload failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // If galleries are disabled and user tries to select multiple photos, only keep the first one
      if (keepsakeType === 'photo' && files.length > 1 && event.enabledKeepsakeTypes?.gallery === false) {
        const singleFile = new DataTransfer();
        singleFile.items.add(files[0]);
        setValue("files", singleFile.files);
        toast({
          title: "Multiple photos not allowed",
          description: "Only one photo can be uploaded when galleries are disabled.",
          variant: "destructive",
        });
      } else if (keepsakeType === 'photo' && files.length > (event.gallerySizeLimit || 10)) {
        // Don't set any files if they exceed the limit
        toast({
          title: "Too many photos selected",
          description: `You can only upload up to ${event.gallerySizeLimit || 10} photos in a gallery. Please select fewer files.`,
          variant: "destructive",
        });
        // Clear the file input
        e.target.value = '';
      } else {
        setValue("files", e.target.files);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={keepsakeType} onValueChange={(value) => handleKeepsakeTypeChange(value as any)} className="w-full">
        <TabsList className={`grid w-full ${getGridClass()}`}>
          {event.enabledKeepsakeTypes?.photo !== false && (
            <TabsTrigger value="photo"><Camera className="mr-2 h-4 w-4" />Photo</TabsTrigger>
          )}
          {event.enabledKeepsakeTypes?.video !== false && (
            <TabsTrigger value="video"><Clapperboard className="mr-2 h-4 w-4" />Video</TabsTrigger>
          )}
          {event.enabledKeepsakeTypes?.text !== false && (
            <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" />Text</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="photo" className="mt-4">
            <Label htmlFor="photo-upload">
              {event.enabledKeepsakeTypes?.gallery !== false 
                ? `Upload Photo(s) (up to ${event.gallerySizeLimit || 10})` 
                : "Upload Photo"
              }
            </Label>
            <Input 
              id="photo-upload" 
              type="file" 
              accept="image/*" 
              multiple={event.enabledKeepsakeTypes?.gallery !== false}
              onChange={handleFileChange} 
            />
            {errors.files && <p className="text-destructive text-sm">{String(errors.files.message)}</p>}
        </TabsContent>
        <TabsContent value="video" className="mt-4">
            <Label htmlFor="video-upload">Upload Video</Label>
            <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} />
            {errors.files && <p className="text-destructive text-sm">{String(errors.files.message)}</p>}
        </TabsContent>
        <TabsContent value="text" className="mt-4">
            <Label htmlFor="text-keepsake">Your Message</Label>
            <Textarea id="text-keepsake" placeholder="Share a heartfelt message..." {...register("text")} rows={4} />
            {errors.text && <p className="text-destructive text-sm">{errors.text.message}</p>}
        </TabsContent>
      </Tabs>

      {keepsakeType !== 'text' && (
        <div>
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea id="caption" placeholder="Add a caption to your keepsake..." {...register("caption")} />
            {errors.caption && <p className="text-destructive text-sm">{errors.caption.message}</p>}
        </div>
      )}


      <div>
        <Label htmlFor="name">Your Name (optional)</Label>
        <Input id="name" placeholder="Your name" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      {event.consentRequired && (
        <div className="flex items-start space-x-2">
           <Controller
            name="consent"
            control={control}
            render={({ field }) => (
              <Checkbox id="consent" checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
            )}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="consent" className="text-sm text-muted-foreground">
                I understand this will be displayed publicly at the event and give my consent.
            </Label>
            {errors.consent && <p className="text-destructive text-sm">{errors.consent.message}</p>}
          </div>
        </div>
      )}

      {uploadProgress !== null && (
        <div className="space-y-2">
          <Label>Uploading...</Label>
          <Progress value={uploadProgress} />
          {uploadLog && <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded-md">{uploadLog}</p>}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting || uploadProgress !== null} className="w-full text-lg h-12">
        <Send className="mr-2 h-5 w-5"/>
        {isSubmitting ? 'Submitting...' : 'Share Keepsake'}
      </Button>
    </form>
  );
}
