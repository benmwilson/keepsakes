import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full size-16 shadow-md", className)}>
      <Camera className="size-8" />
    </div>
  );
}
