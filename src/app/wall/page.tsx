
import { getSingleEvent } from "@/actions/events";
import SimpleMemoryWall from "@/components/simple-memory-wall";
import { notFound } from "next/navigation";
import { Event } from "@/lib/types";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

// Helper function to serialize event object
const serializeEvent = (event: Event) => {
  return {
    ...event,
    createdAt: event.createdAt?.toDate?.()?.toISOString() || null,
    restartAutoplay: event.restartAutoplay?.toDate?.()?.toISOString() || null,
  };
};

export default async function WallPage() {
  const eventData = await getSingleEvent();

  if (!eventData) {
    notFound();
  }



  const event = serializeEvent(eventData);

  return <SimpleMemoryWall event={event} />;
}
