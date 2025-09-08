
"use client";
import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
// TODO: Replace Firebase Storage with file upload solution
// import { getDownloadURL, listAll, ref, uploadBytesResumable } from "firebase/storage";
// import { storage } from "@/lib/firebase";
import { Event, SerializableEvent } from "@/lib/types";
import { updateEvent } from "@/actions/events";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Save, Trash2, ChevronDown, Sparkles, Shield, Eye, EyeOff } from "lucide-react";
import { Progress } from "./ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { getPasswordProtectionStatus, setPasswordProtectionStatus, getSitePassword, setSitePassword } from "@/actions/auth-config";
import { useAuth } from "@/lib/auth-context";

const formSchema = z.object({
  name: z.string().min(1, "Event name is required.").max(100),
  slug: z.string().min(1, "Event slug is required.").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  subtitle: z.string().max(150).optional(),
  instructions: z.string().max(500).optional(),
  heroImageUrl: z.string().optional(),
  heroColor: z.string().optional(),
  consentRequired: z.boolean(),
  allowDownloads: z.boolean(),
  showCaptions: z.boolean().optional(),
  showAuthorNames: z.boolean().optional(),
  enableFullscreen: z.boolean().optional(),
  autoplayDelay: z.coerce.number().int().min(1000, "Must be at least 1 second").max(30000, "Must be at most 30 seconds").optional(),
  galleryItemDelay: z.coerce.number().int().min(1000, "Must be at least 1 second").max(10000, "Must be at most 10 seconds").optional(),
  galleryTransitionDuration: z.coerce.number().int().min(100, "Must be at least 100ms").max(1000, "Must be at most 1 second").optional(),
  mobileGridColumns: z.coerce.number().int().min(1, "Must be at least 1 column").max(4, "Must be at most 4 columns").optional(),
  gallerySizeLimit: z.coerce.number().int().min(1, "Must be at least 1 image").max(20, "Must be at most 20 images").optional(),
  emailRegistrationEnabled: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EventSettingsForm({ 
    event, 
    onDirtyChange 
}: { 
    event: SerializableEvent;
    onDirtyChange: (isDirty: boolean) => void;
}) {
  const { toast } = useToast();
  const { refreshAuthStatus } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Password protection state
  const [isPasswordProtectionEnabled, setIsPasswordProtectionEnabled] = useState(false);
  const [sitePassword, setSitePasswordState] = useState('');
  const [showSitePassword, setShowSitePassword] = useState(false);
  const [originalPasswordEnabled, setOriginalPasswordEnabled] = useState(false);
  const [originalSitePassword, setOriginalSitePassword] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // TODO: Replace with file storage solution
        // Keepsake images are stored in `keepsakes/{eventId}`
        // const listRef = ref(storage, `keepsakes/${event.id}`);
        // const res = await listAll(listRef);
        // const urls = await Promise.all(res.items.map((itemRef) => getDownloadURL(itemRef)));
        // setExistingImages(urls);
        setExistingImages([]); // Temporary empty array
      } catch (e) {
          console.error("Could not list existing images, this may be due to storage rules.", e)
      }
    };
    fetchImages();
  }, [event.id]);

  // Load password protection settings
  useEffect(() => {
    const loadPasswordSettings = async () => {
      try {
        const protectionEnabled = await getPasswordProtectionStatus();
        const currentPassword = await getSitePassword();
        
        setIsPasswordProtectionEnabled(protectionEnabled);
        setSitePasswordState(currentPassword);
        setOriginalPasswordEnabled(protectionEnabled);
        setOriginalSitePassword(currentPassword);
      } catch (error) {
        console.error('Error loading password settings:', error);
      }
    };
    
    loadPasswordSettings();
  }, []);

  const defaultValues = useMemo(() => ({
    name: event.name,
    slug: event.slug,
    subtitle: event.subtitle || "",
    instructions: event.instructions || "",
    heroImageUrl: event.heroImageUrl || "",
    heroColor: event.heroColor || "",
    consentRequired: event.consentRequired,
    allowDownloads: event.allowDownloads ?? false,
    showCaptions: event.showCaptions ?? true,
    showAuthorNames: event.showAuthorNames ?? true,
    enableFullscreen: event.enableFullscreen ?? true,
    autoplayDelay: event.autoplayDelay || 5000,
    galleryItemDelay: event.galleryItemDelay || 5000,
    galleryTransitionDuration: event.galleryTransitionDuration || 500,
    mobileGridColumns: event.mobileGridColumns || 2,
    gallerySizeLimit: event.gallerySizeLimit || 10,
    emailRegistrationEnabled: event.emailRegistrationEnabled ?? false,
  }), [event]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const heroImageUrl = watch("heroImageUrl");
  const heroColor = watch("heroColor");
  
  // Simple dirty checking like keepsake types component
  const currentValues = watch();
  const isFormDirty = JSON.stringify(currentValues) !== JSON.stringify(defaultValues);
  
  // Password protection dirty checking
  const isPasswordProtectionDirty = 
    isPasswordProtectionEnabled !== originalPasswordEnabled || 
    sitePassword !== originalSitePassword;

  // Track overall dirty state
  useEffect(() => {
    const isDirty = isFormDirty || isImageDirty || isPasswordProtectionDirty;
    onDirtyChange(isDirty);
  }, [isFormDirty, isImageDirty, isPasswordProtectionDirty, onDirtyChange]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
      .replace(/^-+|-+$/g, '');     // Remove leading/trailing dashes
  };
  
  const handleGenerateSlug = () => {
    const eventName = watch("name");
    if (eventName) {
      const generatedSlug = generateSlug(eventName);
      setValue("slug", generatedSlug, { shouldDirty: true });
    }
  };

  const handlePasswordProtectionToggle = (enabled: boolean) => {
    setIsPasswordProtectionEnabled(enabled);
  };

  const handleSitePasswordChange = (password: string) => {
    setSitePasswordState(password);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Replace with file upload solution
    toast({ title: "File Upload", description: "File upload functionality needs to be implemented with PostgreSQL storage.", variant: "destructive" });
    /*
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        setUploadProgress(0);
        const storageRef = ref(storage, `event-heroes/${event.id}/${file.name}`);
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
            setValue("heroImageUrl", downloadURL, { shouldDirty: true });
            setIsImageDirty(true);
            toast({ title: "Image Uploaded", description: "Remember to save your changes." });
            setUploadProgress(null);
          }
        );
      }
    }
    */
  };
  
  const handleRemoveImage = () => {
    setValue("heroImageUrl", "", { shouldDirty: true });
    setIsImageDirty(true);
  };
  
  const handleSelectExistingImage = (url: string) => {
    setValue("heroImageUrl", url, { shouldDirty: true });
    setIsImageDirty(true);
    setIsPopoverOpen(false);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Save event settings
      const result = await updateEvent(event.id, event.slug, data);
      
      // Save password protection settings
      if (isPasswordProtectionDirty) {
        const protectionResult = await setPasswordProtectionStatus(isPasswordProtectionEnabled);
        if (!protectionResult.success) {
          toast({
            title: "Password Protection Error",
            description: protectionResult.error || "Failed to update password protection status.",
            variant: "destructive",
          });
          return;
        }
        
        if (sitePassword.trim()) {
          const passwordResult = await setSitePassword(sitePassword);
          if (!passwordResult.success) {
            toast({
              title: "Password Error",
              description: passwordResult.error || "Failed to update site password.",
              variant: "destructive",
            });
            return;
          }
        }
        
        // Refresh auth status to update password protection state
        await refreshAuthStatus();
      }

      if (result.success) {
        reset(data); 
        setIsImageDirty(false);
        setOriginalPasswordEnabled(isPasswordProtectionEnabled);
        setOriginalSitePassword(sitePassword);
        
        // If slug changed, show a special message and redirect
        if (result.newSlug) {
          toast({
            title: "Settings saved!",
            description: `Your event slug has been updated to "${result.newSlug}". Redirecting to the new URL...`,
          });
          
          // Redirect to the new slug after a short delay
          setTimeout(() => {
            window.location.href = `/admin?eventSlug=${result.newSlug}`;
          }, 1500);
        } else {
          toast({
            title: "Settings saved!",
            description: "Your event details and password protection settings have been updated.",
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save password protection settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Event Settings</CardTitle>
            <CardDescription>Customize the details for your event. These will be shown to your guests.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Event Name</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Event Slug</Label>
                        <div className="flex gap-2">
                            <Input id="slug" {...register("slug")} placeholder="my-event" />
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleGenerateSlug}
                                disabled={!watch("name")}
                                title="Generate slug from event name"
                            >
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">This is used in the URL. Only lowercase letters, numbers, and hyphens are allowed.</p>
                        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input id="subtitle" {...register("subtitle")} />
                        {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle.message}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hero Image</Label>
                    <Input id="heroImageFile" type="file" accept="image/*" onChange={handleFileChange} disabled={uploadProgress !== null} />
                    {uploadProgress !== null && <Progress value={uploadProgress} className="mt-2" />}
                  </div>
                   {heroImageUrl && (
                    <div className="relative group w-64">
                      <Image
                        src={heroImageUrl}
                        alt="Hero Image Preview"
                        width={256}
                        height={144}
                        className="rounded-md object-cover h-36 w-64 bg-muted"
                      />
                       <Button type="button" variant="destructive" size="icon" onClick={handleRemoveImage} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  )}
                </div>

                {existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Or select from existing keepsakes</Label>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>{heroImageUrl ? "Change image" : "Select an image"}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <ScrollArea className="h-72">
                        <div className="grid grid-cols-3 gap-2 p-2">
                          {existingImages.map((url) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() => handleSelectExistingImage(url)}
                              className={cn(
                                "relative aspect-square w-full h-full overflow-hidden rounded-md transition-all focus:ring-2 focus:ring-ring ring-offset-2",
                                heroImageUrl === url && "ring-2 ring-ring"
                              )}
                            >
                              <Image
                                src={url}
                                alt="Existing Keepsake"
                                fill
                                sizes="(max-width: 768px) 33vw, 120px"
                                className="object-cover hover:scale-105 transition-transform"
                              />
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="heroColor">Hero Color (if no image)</Label>
                    <div className="flex items-center gap-2">
                      <Controller
                        name="heroColor"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="heroColor" 
                            type="color" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            className="h-10 w-10 p-1"
                          />
                        )}
                      />
                      <Input 
                        type="text"
                        value={heroColor || ""}
                        onChange={(e) => setValue('heroColor', e.target.value, { shouldDirty: true })}
                        placeholder="#FF7F50" 
                        className="w-32 font-mono"
                      />
                    </div>
                    {errors.heroColor && <p className="text-sm text-destructive">{errors.heroColor.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions for Guests</Label>
                    <Textarea id="instructions" {...register("instructions")} />
                    {errors.instructions && <p className="text-sm text-destructive">{errors.instructions.message}</p>}
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium">Keepsake Wall Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">Control the display and interaction of keepsakes on the keepsake wall.</p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="showCaptions"
                                control={control}
                                render={({ field }) => (
                                   <Switch
                                        id="showCaptions"
                                        checked={!!field.value}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                )}
                            />
                            <Label htmlFor="showCaptions">Show captions on keepsake cards</Label>
                            {errors.showCaptions && <p className="text-sm text-destructive">{errors.showCaptions.message}</p>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="showAuthorNames"
                                control={control}
                                render={({ field }) => (
                                   <Switch
                                        id="showAuthorNames"
                                        checked={!!field.value}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                )}
                            />
                            <Label htmlFor="showAuthorNames">Show author names on keepsake cards</Label>
                            {errors.showAuthorNames && <p className="text-sm text-destructive">{errors.showAuthorNames.message}</p>}
                        </div>
                        
                        {/* Fullscreen setting temporarily removed
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="enableFullscreen"
                                control={control}
                                render={({ field }) => (
                                   <Switch
                                        id="enableFullscreen"
                                        checked={!!field.value}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                )}
                            />
                            <Label htmlFor="enableFullscreen">Enable fullscreen mode for keepsakes</Label>
                            {errors.enableFullscreen && <p className="text-sm text-destructive">{errors.enableFullscreen.message}</p>}
                        </div>
                        */}
                    </div>
                    
                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-md font-medium mb-4">Gallery Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="galleryItemDelay">Gallery Image Delay (ms)</Label>
                                <p className="text-sm text-muted-foreground">How long to stay on each image within a gallery keepsake before advancing to the next image.</p>
                                <Input id="galleryItemDelay" type="number" min="1000" max="10000" {...register("galleryItemDelay")} />
                                {errors.galleryItemDelay && <p className="text-sm text-destructive">{errors.galleryItemDelay.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="galleryTransitionDuration">Gallery Transition Duration (ms)</Label>
                                <p className="text-sm text-muted-foreground">How fast the fade transition is when changing between images in a gallery.</p>
                                <Input id="galleryTransitionDuration" type="number" min="100" max="1000" {...register("galleryTransitionDuration")} />
                                {errors.galleryTransitionDuration && <p className="text-sm text-destructive">{errors.galleryTransitionDuration.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gallerySizeLimit">Gallery Size Limit</Label>
                                <p className="text-sm text-muted-foreground">Maximum number of images that can be uploaded in a single gallery keepsake (1-20 images).</p>
                                <Input id="gallerySizeLimit" type="number" min="1" max="20" {...register("gallerySizeLimit")} />
                                {errors.gallerySizeLimit && <p className="text-sm text-destructive">{errors.gallerySizeLimit.message}</p>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-md font-medium mb-4">Autoplay Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="autoplayDelay">Slide Duration (ms)</Label>
                                <p className="text-sm text-muted-foreground">How long each slide stays on screen in swipe mode before advancing to the next keepsake.</p>
                                <Input id="autoplayDelay" type="number" min="1000" max="30000" {...register("autoplayDelay")} />
                                {errors.autoplayDelay && <p className="text-sm text-destructive">{errors.autoplayDelay.message}</p>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-md font-medium mb-4">Grid View Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="mobileGridColumns">Mobile Grid Columns</Label>
                                <p className="text-sm text-muted-foreground">Number of columns to display in grid view on mobile devices (1-4 columns).</p>
                                <Input id="mobileGridColumns" type="number" min="1" max="4" {...register("mobileGridColumns")} />
                                {errors.mobileGridColumns && <p className="text-sm text-destructive">{errors.mobileGridColumns.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium">Privacy & Access Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">Control privacy and access features for your event.</p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="consentRequired"
                                control={control}
                                render={({ field }) => (
                                   <Switch
                                        id="consentRequired"
                                        checked={!!field.value}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                )}
                            />
                            <Label htmlFor="consentRequired">Require guests to give consent before uploading</Label>
                            {errors.consentRequired && <p className="text-sm text-destructive">{errors.consentRequired.message}</p>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="allowDownloads"
                                control={control}
                                render={({ field }) => (
                                   <Switch
                                        id="allowDownloads"
                                        checked={!!field.value}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                )}
                            />
                            <Label htmlFor="allowDownloads">Allow guests to download media from keepsakes</Label>
                            {errors.allowDownloads && <p className="text-sm text-destructive">{errors.allowDownloads.message}</p>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Controller
                                name="emailRegistrationEnabled"
                                control={control}
                                render={({ field }) => (
                                   <Switch
                                        id="emailRegistrationEnabled"
                                        checked={!!field.value}
                                        onCheckedChange={(checked) => field.onChange(checked)}
                                    />
                                )}
                            />
                            <Label htmlFor="emailRegistrationEnabled">Allow guests to sign up for email updates on the thank you page</Label>
                            {errors.emailRegistrationEnabled && <p className="text-sm text-destructive">{errors.emailRegistrationEnabled.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Site Password Protection
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Control whether guests need a password to access the site.</p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="passwordProtection"
                                checked={isPasswordProtectionEnabled}
                                onCheckedChange={handlePasswordProtectionToggle}
                            />
                            <Label htmlFor="passwordProtection">Enable password protection for site access</Label>
                        </div>
                        
                        {isPasswordProtectionEnabled && (
                            <div className="space-y-2 pl-6">
                                <Label htmlFor="sitePassword">Site Password</Label>
                                <div className="relative">
                                    <Input
                                        id="sitePassword"
                                        type={showSitePassword ? "text" : "password"}
                                        value={sitePassword}
                                        onChange={(e) => handleSitePasswordChange(e.target.value)}
                                        placeholder="Enter site password"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowSitePassword(!showSitePassword)}
                                    >
                                        {showSitePassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This password will be required for guests to access the site.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting || (!isFormDirty && !isImageDirty && !isPasswordProtectionDirty) || uploadProgress !== null}>
                    <Save className="mr-2 h-4 w-4"/>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

    
