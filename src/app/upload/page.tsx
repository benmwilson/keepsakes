
import { getSingleEvent } from "@/actions/events";
import UploadForm from "@/components/upload-form";
import Logo from "@/components/logo";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "@/components/motion";
import { Event } from "@/lib/types";
import SharedLayout from "@/components/shared-layout";

// Helper function to serialize event object
const serializeEvent = (event: Event) => {
  return {
    ...event,
    createdAt: event.createdAt?.toISOString() || null,
    restartAutoplay: event.restartAutoplay?.toISOString() || null,
  };
};

export default async function UploadPage(): Promise<JSX.Element> {
  const eventData = await getSingleEvent();

  if (!eventData) {
    return <div className="text-center p-8">Event not found.</div>;
  }



  const event = serializeEvent(eventData);

  return (
    <SharedLayout
      pageType="upload"
      eventSlug={eventData.slug}
      uploadHref={`/upload?eventSlug=${eventData.slug}`}
    >
      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl mx-auto"
        >
          <div 
            className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-8 shadow-lg"
            style={{ backgroundColor: event.heroImageUrl ? 'transparent' : event.heroColor || 'hsl(var(--primary))' }}
          >
            {event.heroImageUrl && (
              <Image
                src={event.heroImageUrl}
                alt={event.name}
                fill
                className="object-cover"
                data-ai-hint="birthday party"
                priority
              />
            )}
            <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-4 ${event.heroImageUrl ? 'bg-black/50' : ''}`}>
              <h1 className={`font-headline text-4xl md:text-6xl font-bold ${event.heroImageUrl || event.heroColor ? 'text-white' : 'text-primary'}`}>
                {event.name}
              </h1>
              <p className={`text-lg md:text-2xl mt-2 font-headline ${event.heroImageUrl || event.heroColor ? 'text-white/90' : 'text-foreground/80'}`}>
                {event.subtitle}
              </p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm p-6 sm:p-8 rounded-lg shadow-sm border">
            {event.instructions && (
              <div className="max-w-none mb-6 text-center text-muted-foreground italic">
                <p className="whitespace-pre-line">{event.instructions}</p>
              </div>
            )}
            <UploadForm event={event} />
          </div>
        </MotionDiv>
      </div>
    </SharedLayout>
  );
}
