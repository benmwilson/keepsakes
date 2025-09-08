"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Download, Image, Video, FileText, GalleryHorizontal } from "lucide-react";
import { downloadFile, downloadMultipleFiles, generateFilename } from "@/lib/download-utils";
import { Keepsake } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface DownloadButtonProps {
  keepsake: Keepsake;
  currentGalleryIndex?: number;
  allowDownloads: boolean;
  isAdmin?: boolean;
}

export default function DownloadButton({ keepsake, currentGalleryIndex = 0, allowDownloads, isAdmin = false }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if ((!allowDownloads && !isAdmin) || (keepsake.type === "text" && !isAdmin)) {
    return null;
  }

  const handleDownload = async (downloadAll: boolean = false) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      const baseFilename = generateFilename(
        keepsake.caption || keepsake.type,
        keepsake.name
      );

             switch (keepsake.type) {
         case "photo":
           if (keepsake.fileUrls?.[0]) {
             await downloadFile(keepsake.fileUrls[0], `${baseFilename}.jpg`);
             toast({ title: "Photo downloaded successfully!" });
           }
           break;
           
         case "video":
           const videoUrl = keepsake.fileUrls?.[0] || keepsake.fileUrl;
           if (videoUrl) {
             await downloadFile(videoUrl, `${baseFilename}.mp4`);
             toast({ title: "Video downloaded successfully!" });
           }
           break;
           
         case "gallery":
           if (keepsake.fileUrls && keepsake.fileUrls.length > 0) {
             if (downloadAll) {
               await downloadMultipleFiles(keepsake.fileUrls, baseFilename);
               toast({ title: `All ${keepsake.fileUrls.length} images downloaded successfully!` });
             } else {
               // Download current image only
               const currentImageUrl = keepsake.fileUrls[currentGalleryIndex];
               if (currentImageUrl) {
                 await downloadFile(currentImageUrl, `${baseFilename}_${currentGalleryIndex + 1}.jpg`);
                 toast({ title: "Image downloaded successfully!" });
               }
             }
           }
           break;
           
         case "text":
           if (isAdmin) {
             // For text, create a text file with the content
             const textContent = keepsake.text || "";
             const blob = new Blob([textContent], { type: 'text/plain' });
             const url = window.URL.createObjectURL(blob);
             const link = document.createElement('a');
             link.href = url;
             link.download = `${baseFilename}.txt`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             window.URL.revokeObjectURL(url);
             toast({ title: "Text downloaded successfully!" });
           }
           break;
       }
    } catch (error) {
      console.error('Download failed:', error);
      toast({ 
        title: "Download failed", 
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getIcon = () => {
    switch (keepsake.type) {
      case "photo":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "gallery":
        return <GalleryHorizontal className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    if (isDownloading) return "Downloading...";
    
    switch (keepsake.type) {
      case "photo":
        return "Download Photo";
      case "video":
        return "Download Video";
      case "gallery":
        return "Download";
      case "text":
        return "Download Text";
      default:
        return "Download";
    }
  };

  // For galleries, show dropdown with options
  if (keepsake.type === "gallery" && keepsake.fileUrls && keepsake.fileUrls.length > 1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isDownloading}
            className="gap-2 focus:ring-0 focus:ring-offset-0"
          >
            {getIcon()}
            {getButtonText()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleDownload(false)}>
            <Image className="h-4 w-4 mr-2" />
            Download Current Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload(true)}>
            <GalleryHorizontal className="h-4 w-4 mr-2" />
            Download All Images ({keepsake.fileUrls.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For other types, show simple button
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => handleDownload()}
      disabled={isDownloading}
      className="gap-2 focus:ring-0 focus:ring-offset-0"
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  );
}
