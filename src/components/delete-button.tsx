"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, Image, GalleryHorizontal } from "lucide-react";
import { Keepsake } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface DeleteButtonProps {
  keepsake: Keepsake;
  currentGalleryIndex?: number;
  onDelete: (keepsakeId: string) => Promise<void>;
  onDeleteGalleryItem?: (keepsakeId: string, itemIndex: number) => Promise<void>;
}

export default function DeleteButton({ 
  keepsake, 
  currentGalleryIndex = 0, 
  onDelete, 
  onDeleteGalleryItem 
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      await onDelete(keepsake.id);
      toast({ title: "Keepsake deleted successfully!" });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({ 
        title: "Delete failed", 
        description: "There was an error deleting the keepsake. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteGalleryItem = async () => {
    if (isDeleting || !onDeleteGalleryItem) return;
    
    setIsDeleting(true);
    
    try {
      await onDeleteGalleryItem(keepsake.id, currentGalleryIndex);
      toast({ title: "Gallery item deleted successfully!" });
    } catch (error) {
      console.error('Gallery item delete failed:', error);
      toast({ 
        title: "Delete failed", 
        description: "There was an error deleting the gallery item. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // For galleries with multiple items, show dropdown with options
  if (keepsake.type === "gallery" && keepsake.fileUrls && keepsake.fileUrls.length > 1 && onDeleteGalleryItem) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isDeleting}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Image className="h-4 w-4 mr-2" />
                Delete Current Image
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Gallery Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this image from the gallery? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGalleryItem} className="bg-destructive hover:bg-destructive/90">
                  Delete Item
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <GalleryHorizontal className="h-4 w-4 mr-2" />
                Delete Entire Gallery
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Entire Gallery</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this entire gallery keepsake? This will remove all {keepsake.fileUrls.length} images and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete Gallery
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For other types, show simple delete button
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isDeleting}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Keepsake</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this keepsake? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
