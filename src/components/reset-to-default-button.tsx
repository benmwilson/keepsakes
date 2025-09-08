'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { resetToDefault } from '@/actions/reset';
import { useRouter } from 'next/navigation';

export default function ResetToDefaultButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleReset = async () => {
    if (confirmationText !== 'RESET') {
      toast({
        title: "Confirmation required",
        description: "Please type 'RESET' to confirm the reset operation.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    
    try {
      const result = await resetToDefault();
      
      if (result.success) {
        toast({
          title: "Reset successful",
          description: "The application has been reset to default state. Redirecting to setup...",
        });
        
        // Close the modal
        setIsOpen(false);
        setConfirmationText('');
        
        // Redirect to setup page after a short delay
        setTimeout(() => {
          router.push('/setup');
        }, 2000);
        
      } else {
        toast({
          title: "Reset failed",
          description: result.error || "An error occurred while resetting the application.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="h-8 px-3 text-xs"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset to Default
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reset to Default
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action will <strong>permanently delete all data</strong> including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>All events and their settings</li>
              <li>All uploaded keepsakes (photos, videos, messages)</li>
              <li>All admin users and passwords</li>
              <li>All guest registrations</li>
              <li>All application configuration</li>
            </ul>
            <p className="text-sm font-medium text-destructive">
              This action cannot be undone!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <code className="bg-muted px-1 py-0.5 rounded text-sm">RESET</code> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type RESET here"
              disabled={isResetting}
              className="font-mono"
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isResetting || confirmationText !== 'RESET'}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isResetting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Resetting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset Everything
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
