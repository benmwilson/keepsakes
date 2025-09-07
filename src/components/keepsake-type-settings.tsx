"use client";

import { useState, useEffect } from "react";
import { Event, SerializableEvent } from "@/lib/types";
import { Button } from "./ui/button";
import { Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Camera, Clapperboard, FileText, GalleryHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface KeepsakeTypeSettingsProps {
  event: SerializableEvent;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function KeepsakeTypeSettings({ event, onDirtyChange }: KeepsakeTypeSettingsProps) {
  const [enabledTypes, setEnabledTypes] = useState({
    photo: event.enabledKeepsakeTypes?.photo ?? true,
    video: event.enabledKeepsakeTypes?.video ?? true,
    text: event.enabledKeepsakeTypes?.text ?? true,
    gallery: event.enabledKeepsakeTypes?.gallery ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  // Check if at least one type is enabled
  const hasEnabledTypes = Object.values(enabledTypes).some(Boolean);

  // Track dirty state
  useEffect(() => {
    const originalState = {
      photo: event.enabledKeepsakeTypes?.photo ?? true,
      video: event.enabledKeepsakeTypes?.video ?? true,
      text: event.enabledKeepsakeTypes?.text ?? true,
      gallery: event.enabledKeepsakeTypes?.gallery ?? true,
    };
    const dirty = JSON.stringify(enabledTypes) !== JSON.stringify(originalState);
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [enabledTypes, event.enabledKeepsakeTypes, onDirtyChange]);

  const handleTypeToggle = (type: keyof typeof enabledTypes) => {
    const newEnabledTypes = { ...enabledTypes };
    newEnabledTypes[type] = !newEnabledTypes[type];
    
    // Ensure at least one type remains enabled
    if (!newEnabledTypes[type] && Object.values(newEnabledTypes).filter(Boolean).length === 0) {
      toast({
        title: "Cannot disable all types",
        description: "At least one keepsake type must be enabled.",
        variant: "destructive",
      });
      return;
    }
    
    setEnabledTypes(newEnabledTypes);
  };

  const handleSave = async () => {
    if (!hasEnabledTypes) {
      toast({
        title: "Invalid configuration",
        description: "At least one keepsake type must be enabled.",
        variant: "destructive",
      });
      return;
    }

    if (!db) {
      toast({
        title: "Firebase not initialized",
        description: "Cannot save settings. Please check your configuration.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "events", event.id), {
        enabledKeepsakeTypes: enabledTypes,
      });
      
      setIsDirty(false);
      toast({
        title: "Settings saved",
        description: "Keepsake type settings have been updated.",
      });
    } catch (error) {
      console.error("Failed to save keepsake type settings:", error);
      toast({
        title: "Save failed",
        description: "Failed to save keepsake type settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeIcon = (type: keyof typeof enabledTypes) => {
    switch (type) {
      case "photo":
        return <Camera className="h-4 w-4" />;
      case "video":
        return <Clapperboard className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "gallery":
        return <GalleryHorizontal className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: keyof typeof enabledTypes) => {
    switch (type) {
      case "photo":
        return "Photos";
      case "video":
        return "Videos";
      case "text":
        return "Text Messages";
      case "gallery":
        return "Photo Galleries";
      default:
        return type;
    }
  };

  const getTypeDescription = (type: keyof typeof enabledTypes) => {
    switch (type) {
      case "photo":
        return "Allow users to upload single photos";
      case "video":
        return "Allow users to upload video files";
      case "text":
        return "Allow users to share text messages";
      case "gallery":
        return "Allow users to upload multiple photos at once";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keepsake Types</CardTitle>
        <CardDescription>
          Choose which types of keepsakes guests can upload. At least one type must be enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {(Object.keys(enabledTypes) as Array<keyof typeof enabledTypes>).map((type) => (
            <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getTypeIcon(type)}
                <div>
                  <Label htmlFor={`toggle-${type}`} className="text-sm font-medium">
                    {getTypeLabel(type)}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {getTypeDescription(type)}
                  </p>
                </div>
              </div>
              <Switch
                id={`toggle-${type}`}
                checked={enabledTypes[type]}
                onCheckedChange={() => handleTypeToggle(type)}
              />
            </div>
          ))}
                </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isDirty || !hasEnabledTypes}
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4"/>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
