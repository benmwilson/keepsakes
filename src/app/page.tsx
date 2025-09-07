
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, GalleryHorizontal, PanelTopOpen, LogOut } from "lucide-react";
import Logo from "@/components/logo";
import { MotionDiv } from "@/components/motion";
import SharedLayout from "@/components/shared-layout";
import { APP_CONFIG } from "@/lib/config";
import { getSingleEvent } from "@/lib/events";
import LogoutButton from "@/components/logout-button";

export default async function Home() {
  // Get the single event to use its actual slug
  const eventData = await getSingleEvent();
  const currentSlug = eventData?.slug || APP_CONFIG.DEFAULT_EVENT_SLUG;
  return (
    <SharedLayout showHeader={false} pageType="home">
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-background text-foreground">
        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            {APP_CONFIG.APP_NAME}
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground font-medium italic">
            Made by Ben — for my Dad
          </p>
          <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Create a living collage of keepsakes for your special events. Guests can
            share photos, videos, and messages in real-time.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="font-bold text-lg h-14 hover:bg-primary/90">
              <Link href={`/upload?eventSlug=${currentSlug}`}>
                <PanelTopOpen className="mr-2" />
                Upload a Keepsake
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="font-bold text-lg h-14 hover:bg-secondary/80">
              <Link href={`/wall?eventSlug=${currentSlug}`}>
                <GalleryHorizontal className="mr-2" />
                View the Wall
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" variant="ghost" className="font-bold text-lg h-14 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-muted-foreground/20 hover:border-muted-foreground/40">
              <Link href="/about">
                About Keepsakes
              </Link>
            </Button>
          </div>
          <div className="mt-8 text-center space-y-2">
            <Link
              href={`/admin?eventSlug=${currentSlug}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline block"
            >
              Admin Dashboard
            </Link>
            <LogoutButton />
          </div>
        </MotionDiv>
      </div>
    </SharedLayout>
  );
}
