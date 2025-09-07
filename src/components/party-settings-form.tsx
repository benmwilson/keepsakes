
"use client";
import { listAll, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { storage } from "@/lib/firebase";
import { Party } from "@/lib/types";
import { updateParty } from "@/actions/parties";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Save } from "lucide-react";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
type SerializableParty = Omit<Party, "createdAt"> & { createdAt: string };

const formSchema = z.object({
  name: z.string().min(1, "Party name is required.").max(100),
  subtitle: z.string().max(150).optional(),
  instructions: z.string().max(500).optional(),
  heroImageFile: z.any().optional(),
  consentRequired: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PartySettingsForm({ 
    party, 
    onDirtyChange 
}: { 
    party: SerializableParty;
    onDirtyChange: (isDirty: boolean) => void;
}) {
  const { toast } = useToast();
  const [heroImageUrl, setHeroImageUrl] = useState(party.heroImageUrl || "");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Fetch existing images for the party on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const listRef = ref(storage, `keepsakes/${party.id}`);
        const res = await listAll(listRef);
        const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
        setExistingImages(urls);
      } catch (e) {
          console.error("Could not list existing images, this may be due to storage rules.", e)
      }
    };
    fetchImages();
  }, [party.id]);
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty: isFormDirty },
    watch
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: party.name,
      subtitle: party.subtitle || "",
      instructions: party.instructions || "",
      consentRequired: party.consentRequired,
    },
  });

  const allFormValues = watch();
  const isImageDirty = party.heroImageUrl !== heroImageUrl;
  const isDirty = isFormDirty || isImageDirty;
  
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        setUploadProgress(0);
        const storageRef = ref(storage, `party-heroes/${party.id}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload failed:", error);
            toast({ title: "Upload Failed", description: `Could not upload the hero image. Check CORS settings. Error: ${error.message}`, variant: "destructive" });
            setUploadProgress(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setHeroImageUrl(downloadURL);
            toast({ title: "Image Uploaded", description: "Remember to save your changes." });
            setUploadProgress(null);
          }
        );
      }
    }
  };

  const handleSelectExistingImage = (url: string) => {
    setHeroImageUrl(url);
    setValue("heroImageFile", undefined, { shouldDirty: true });
    setUploadProgress(null); 
    toast({ title: "Image Selected", description: "Remember to save your changes." });
  };

  const onSubmit = async (data: FormValues) => {
    const partyData: Partial<Omit<Party, 'id' | 'createdAt'>> = {
        name: data.name,
        subtitle: data.subtitle,
        instructions: data.instructions,
        consentRequired: data.consentRequired,
        heroImageUrl: heroImageUrl,
    };
    
    const result = await updateParty(party.id, partyData);
    if (result.success) {
      onDirtyChange(false);
      toast({
        title: "Settings saved!",
        description: "Your party details have been updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Party Settings</CardTitle>
            <CardDescription>Customize the details for your event. These will be shown to your guests.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Party Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input id="subtitle" {...register("subtitle")} />
                    {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Hero Image</Label>
                  <div className="flex items-center gap-4">
                    {heroImageUrl && (
                      <Image 
                        src={heroImageUrl} 
                        alt="Hero Image Preview" 
                        width={128} 
                        height={72} 
                        className="rounded-md object-cover h-18 w-32 bg-muted"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                       <Input id="heroImageFile" type="file" accept="image/*" onChange={handleFileChange} disabled={uploadProgress !== null} />
                       {uploadProgress !== null && <Progress value={uploadProgress} />}
                    </div>
                  </div>
                  {existingImages.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="existingHeroImage">Or select an existing image</Label>
                      <Controller
                        name="heroImageFile"
                        control={control}
                        render={() => (
                           <Select onValueChange={handleSelectExistingImage} value={heroImageUrl}>
                                <SelectTrigger id="existingHeroImage">
                                <SelectValue placeholder="Select an image" />
                                </SelectTrigger>
                                <SelectContent>
                                    <ScrollArea className="h-48 w-full">
                                        <div className="grid grid-cols-3 gap-2 p-2">
                                        {existingImages.map((url) => (
                                            <SelectItem key={url} value={url} className="p-0">
                                                <div
                                                    className={`relative aspect-video cursor-pointer overflow-hidden rounded-md w-full h-full`}
                                                >
                                                    <Image
                                                    src={url}
                                                    alt="Existing Image"
                                                    fill
                                                    className="object-cover"
                                                    />
                                                </div>
                                            </SelectItem>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </SelectContent>
                           </Select>
                        )}
                      />
                    </div>
                  )}
                  {errors.heroImageFile && <p className="text-sm text-destructive">{String(errors.heroImageFile.message)}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions for Guests</Label>
                    <Textarea id="instructions" {...register("instructions")} />
                    {errors.instructions && <p className="text-sm text-destructive">{errors.instructions.message}</p>}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Controller
                        name="consentRequired"
                        control={control}
                        render={({ field }) => (
                           <Switch
                                id="consentRequired"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="consentRequired">Require guests to give content before uploading</Label>
                    {errors.consentRequired && <p className="text-sm text-destructive">{errors.consentRequired.message}</p>}
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting || !isDirty || uploadProgress !== null}>
                    <Save className="mr-2 h-4 w-4"/>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

    