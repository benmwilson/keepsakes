"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calendar, 
  User, 
  Shield, 
  BarChart3, 
  Settings,
  Camera,
  Clapperboard,
  FileText,
  GalleryHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import { completeFirstTimeSetup } from "@/actions/setup";
import type { SetupData } from "@/lib/types/setup";

const setupSchema = z.object({
  // Event Configuration
  eventName: z.string().min(1, "Event name is required").max(100),
  eventSlug: z.string().min(1, "Event slug is required").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  eventSubtitle: z.string().max(150).optional(),
  eventInstructions: z.string().max(500).optional(),
  
  // Admin User
  adminUsername: z.string().min(3, "Username must be at least 3 characters").max(50),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  
  // Security
  sitePassword: z.string().optional(),
  enablePasswordProtection: z.boolean(),
  
  // Google Analytics
  enableGoogleAnalytics: z.boolean(),
  googleAnalyticsId: z.string().optional(),
  
  // Event Settings
  consentRequired: z.boolean(),
  allowDownloads: z.boolean(),
  showCaptions: z.boolean(),
  showAuthorNames: z.boolean(),
  enableFullscreen: z.boolean(),
  autoplayDelay: z.coerce.number().int().min(1000).max(30000),
  galleryItemDelay: z.coerce.number().int().min(1000).max(10000),
  galleryTransitionDuration: z.coerce.number().int().min(100).max(1000),
  mobileGridColumns: z.coerce.number().int().min(1).max(4),
  gallerySizeLimit: z.coerce.number().int().min(1).max(20),
  emailRegistrationEnabled: z.boolean(),
  
  // Keepsake Types
  enabledKeepsakeTypes: z.object({
    photo: z.boolean(),
    video: z.boolean(),
    text: z.boolean(),
    gallery: z.boolean(),
  }).refine(data => Object.values(data).some(Boolean), "At least one keepsake type must be enabled"),
});

type SetupFormData = z.infer<typeof setupSchema>;

const STEPS = [
  { id: 1, title: "Event Details", icon: Calendar, description: "Basic event information" },
  { id: 2, title: "Admin Account", icon: User, description: "Create your admin account" },
  { id: 3, title: "Security", icon: Shield, description: "Password protection settings" },
  { id: 4, title: "Analytics", icon: BarChart3, description: "Google Analytics configuration" },
  { id: 5, title: "Keepsake Types", icon: Settings, description: "Enable content types" },
  { id: 6, title: "Display Settings", icon: Settings, description: "Wall appearance and behavior" },
];

export default function FirstTimeSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ admin: false, site: false });
  const { toast } = useToast();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    register,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      eventName: "",
      eventSlug: "",
      eventSubtitle: "",
      eventInstructions: "Share your favorite memory from this event! It can be a photo, a short video, or a heartfelt message.",
      adminUsername: "",
      adminPassword: "",
      sitePassword: "",
      enablePasswordProtection: false,
      enableGoogleAnalytics: false,
      googleAnalyticsId: "",
      consentRequired: true,
      allowDownloads: true,
      showCaptions: true,
      showAuthorNames: true,
      enableFullscreen: true,
      autoplayDelay: 5000,
      galleryItemDelay: 5000,
      galleryTransitionDuration: 500,
      mobileGridColumns: 2,
      gallerySizeLimit: 10,
      emailRegistrationEnabled: false,
      enabledKeepsakeTypes: {
        photo: true,
        video: true,
        text: true,
        gallery: true,
      },
    },
    mode: "onChange",
  });

  const watchedValues = watch();
  const progress = (currentStep / STEPS.length) * 100;

  const nextStep = async () => {
    // Define which fields to validate for each step
    const stepFields: Record<number, (keyof SetupFormData)[]> = {
      1: ['eventName', 'eventSlug'],
      2: ['adminUsername', 'adminPassword'],
      3: ['sitePassword'], // Only validate if password protection is enabled
      4: ['googleAnalyticsId'], // Only validate if GA is enabled
      5: ['enabledKeepsakeTypes'],
      6: ['autoplayDelay', 'galleryItemDelay', 'galleryTransitionDuration', 'mobileGridColumns', 'gallerySizeLimit']
    };

    const fieldsToValidate = stepFields[currentStep] || [];
    
    // For step 3, only validate sitePassword if password protection is enabled
    if (currentStep === 3 && !watchedValues.enablePasswordProtection) {
      fieldsToValidate.length = 0;
    }
    
    // For step 4, only validate googleAnalyticsId if GA is enabled
    if (currentStep === 4 && !watchedValues.enableGoogleAnalytics) {
      fieldsToValidate.length = 0;
    }

    const isStepValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);
    
    if (isStepValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else if (!isStepValid) {
      // Show error toast if validation fails
      toast({
        title: "Please fix the errors",
        description: "Please correct the highlighted fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);
    try {
      const result = await completeFirstTimeSetup(data as SetupData);
      
      if (result.success) {
        toast({
          title: "Setup Complete!",
          description: "Your Keepsakes app is ready to use.",
        });
        router.push("/setup/success");
      } else {
        toast({
          title: "Setup Failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                {...register("eventName")}
                placeholder="e.g., Sarah's Birthday Party"
              />
              {errors.eventName && <p className="text-sm text-red-500">{errors.eventName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventSlug">Event URL Slug *</Label>
              <Input
                id="eventSlug"
                {...register("eventSlug")}
                placeholder="e.g., sarahs-birthday"
              />
              <p className="text-sm text-muted-foreground">
                This will be used in your event URL: yoursite.com/wall?eventSlug=sarahs-birthday
              </p>
              {errors.eventSlug && <p className="text-sm text-red-500">{errors.eventSlug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventSubtitle">Event Subtitle</Label>
              <Input
                id="eventSubtitle"
                {...register("eventSubtitle")}
                placeholder="e.g., Celebrating 25 Years!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventInstructions">Instructions for Guests</Label>
              <Textarea
                id="eventInstructions"
                {...register("eventInstructions")}
                placeholder="Tell your guests what to share..."
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminUsername">Admin Username *</Label>
              <Input
                id="adminUsername"
                {...register("adminUsername")}
                placeholder="Enter your username"
              />
              {errors.adminUsername && <p className="text-sm text-red-500">{errors.adminUsername.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password *</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPasswords.admin ? "text" : "password"}
                  {...register("adminPassword")}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, admin: !prev.admin }))}
                >
                  {showPasswords.admin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.adminPassword && <p className="text-sm text-red-500">{errors.adminPassword.message}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enablePasswordProtection">Enable Site Password Protection</Label>
                <p className="text-sm text-muted-foreground">
                  Require a password for guests to access the memory wall
                </p>
              </div>
              <Controller
                name="enablePasswordProtection"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="enablePasswordProtection"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {watchedValues.enablePasswordProtection && (
              <div className="space-y-2">
                <Label htmlFor="sitePassword">Site Password *</Label>
                <div className="relative">
                  <Input
                    id="sitePassword"
                    type={showPasswords.site ? "text" : "password"}
                    {...register("sitePassword", { 
                      required: watchedValues.enablePasswordProtection ? "Site password is required when password protection is enabled" : false,
                      minLength: { value: 6, message: "Password must be at least 6 characters" }
                    })}
                    placeholder="Enter site password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, site: !prev.site }))}
                  >
                    {showPasswords.site ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.sitePassword && <p className="text-sm text-red-500">{errors.sitePassword.message}</p>}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Password protection can be configured later in the admin settings if you prefer to skip this step now.
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableGoogleAnalytics">Enable Google Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Track usage statistics and improve your app
                </p>
              </div>
              <Controller
                name="enableGoogleAnalytics"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="enableGoogleAnalytics"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {watchedValues.enableGoogleAnalytics && (
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics Measurement ID *</Label>
                <Input
                  id="googleAnalyticsId"
                  {...register("googleAnalyticsId", {
                    required: watchedValues.enableGoogleAnalytics ? "Google Analytics ID is required when analytics is enabled" : false,
                    pattern: {
                      value: /^G-[A-Z0-9]{10}$/,
                      message: "Please enter a valid Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)"
                    }
                  })}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Find this in your Google Analytics 4 property settings
                </p>
                {errors.googleAnalyticsId && <p className="text-sm text-red-500">{errors.googleAnalyticsId.message}</p>}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Google Analytics can be configured later in the admin settings if you prefer to skip this step now.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Choose which types of content guests can share:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "photo", label: "Photos", icon: Camera, description: "Single images" },
                { key: "video", label: "Videos", icon: Clapperboard, description: "Video files" },
                { key: "text", label: "Text Messages", icon: FileText, description: "Written messages" },
                { key: "gallery", label: "Photo Galleries", icon: GalleryHorizontal, description: "Multiple images" },
              ].map(({ key, label, icon: Icon, description }) => (
                <Card key={key} className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Controller
                        name={`enabledKeepsakeTypes.${key as keyof typeof watchedValues.enabledKeepsakeTypes}`}
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Icon className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errors.enabledKeepsakeTypes && (
              <p className="text-sm text-red-500">{errors.enabledKeepsakeTypes.message}</p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Display Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showCaptions">Show Captions</Label>
                  <Controller
                    name="showCaptions"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showAuthorNames">Show Author Names</Label>
                  <Controller
                    name="showAuthorNames"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableFullscreen">Enable Fullscreen</Label>
                  <Controller
                    name="enableFullscreen"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowDownloads">Allow Downloads</Label>
                  <Controller
                    name="allowDownloads"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Timing Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="autoplayDelay">Autoplay Delay (ms)</Label>
                  <Input
                    id="autoplayDelay"
                    type="number"
                    {...register("autoplayDelay")}
                  />
                  {errors.autoplayDelay && <p className="text-sm text-red-500">{errors.autoplayDelay.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="galleryItemDelay">Gallery Item Delay (ms)</Label>
                  <Input
                    id="galleryItemDelay"
                    type="number"
                    {...register("galleryItemDelay")}
                  />
                  {errors.galleryItemDelay && <p className="text-sm text-red-500">{errors.galleryItemDelay.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileGridColumns">Mobile Grid Columns</Label>
                  <Input
                    id="mobileGridColumns"
                    type="number"
                    min="1"
                    max="4"
                    {...register("mobileGridColumns")}
                  />
                  {errors.mobileGridColumns && <p className="text-sm text-red-500">{errors.mobileGridColumns.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consentRequired">Require Guest Consent</Label>
                <p className="text-sm text-muted-foreground">
                  Guests must agree to terms before uploading
                </p>
              </div>
              <Controller
                name="consentRequired"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Welcome to Keepsakes!</CardTitle>
            <CardDescription className="text-lg">
              Let's set up your memory wall app
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep} of {STEPS.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Header */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5" })}
              </div>
              <div>
                <h2 className="font-semibold text-lg">{STEPS[currentStep - 1].title}</h2>
                <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
              </div>
            </div>

            {/* Step Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {renderStep()}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Setting up..." : "Complete Setup"}
                    <Check className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
