"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addGuestEmail } from "@/actions/guests";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, PartyPopper, PlusCircle } from "lucide-react";
import { MotionDiv } from "@/components/motion";
import { getSingleEvent } from "@/actions/events";
import type { Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import SharedLayout from "@/components/shared-layout";

type SerializableEvent = Omit<Event, "createdAt"> & { createdAt: string };

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().optional(),
});
type EmailFormValues = z.infer<typeof emailSchema>;

function ThanksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const eventSlug = searchParams.get("eventSlug");
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [event, setEvent] = useState<SerializableEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventSlug) {
        router.push("/");
        return;
    }
    const fetchEvent = async () => {
        try {
            const eventData = await getSingleEvent();
            if (eventData) {

                
                setEvent({
                    ...eventData,
                    createdAt: eventData.createdAt?.toISOString() || null,
                });
            } else {
                router.push("/");
            }
        } catch (error) {
            console.error("Failed to fetch event", error);
            router.push("/");
        } finally {
            setLoading(false);
        }
    };
    fetchEvent();
  },[eventSlug, eventId, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
        email: "",
        name: "",
    }
  });

  const onSubmit = async (data: EmailFormValues) => {
    if (!eventId) return;
    try {
      const result = await addGuestEmail(eventId, data);
      if (result.success) {
        toast({
          title: "Got it!",
          description: "We'll send you the link after the event.",
        });
        setSubmitted(true);
      } else {
        toast({
          title: "Oh no!",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Oh no!",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
      return (
          <SharedLayout pageType="thanks" eventSlug={eventSlug || undefined} showHeader={false}>
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
                  <Card className="w-full max-w-md">
                      <CardHeader>
                          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                          <Skeleton className="h-8 w-3/4 mx-auto mt-4" />
                          <Skeleton className="h-4 w-full mx-auto mt-2" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <Skeleton className="h-4 w-3/4 mx-auto" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                      </CardContent>
                      <CardFooter className="flex-col gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </CardFooter>
                  </Card>
              </div>
          </SharedLayout>
      )
  }

  if (!eventId || !eventSlug || !event) {
    router.push("/");
    return null;
  }

  return (
    <SharedLayout pageType="thanks" eventSlug={eventSlug} showHeader={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <MotionDiv
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
        <Card className="text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                    <PartyPopper className="h-12 w-12" />
                </div>
                <CardTitle className="font-headline text-4xl">Thank You!</CardTitle>
                <CardDescription>Your keepsake has submitted. It will appear on the wall shortly.</CardDescription>
            </CardHeader>
            {!submitted ? (
            <>
            {event.emailRegistrationEnabled === true ? (
            <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Enter your email to get a link to the final gallery after the event.</p>
                <div className="space-y-2 text-left">
                    <Label htmlFor="name">Your Name (optional)</Label>
                    <Input id="name" type="text" placeholder="Jane Doe" {...register("name")} />
                    {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                </div>
                <div className="space-y-2 text-left">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                    {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Submitting...' : 'Keep me posted'}
                </Button>
                 <Button asChild variant="outline" className="w-full">
                    <Link href={`/upload?eventSlug=${eventSlug}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Post Another Keepsake
                    </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                    <Link href={`/wall?eventSlug=${eventSlug}`}>No thanks, take me to the wall</Link>
                </Button>
            </CardFooter>
            </form>
            ) : (
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                        <Link href={`/upload?eventSlug=${eventSlug}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Post Another Keepsake
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                        <Link href={`/wall?eventSlug=${eventSlug}`}>View the Keepsake Wall</Link>
                    </Button>
                </div>
            </CardContent>
            )}
            </>
            ) : (
                <CardContent className="space-y-4">
                    <div className="mx-auto bg-green-500/10 text-green-500 rounded-full p-3 w-fit mb-4">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <p className="font-semibold text-lg">You're on the list!</p>
                    <p className="text-muted-foreground">We'll email you after the event ends.</p>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button asChild className="w-full">
                            <Link href={`/wall?eventSlug=${eventSlug}`}>View the Keepsake Wall</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/upload?eventSlug=${eventSlug}`}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Post Another Keepsake
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            )}
                  </Card>
        </MotionDiv>
      </div>
    </SharedLayout>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={<ThanksLoadingFallback />}>
      <ThanksContent />
    </Suspense>
  );
}

function ThanksLoadingFallback() {
  return (
    <SharedLayout pageType="thanks" eventSlug={undefined} showHeader={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded mb-4"></div>
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-6 bg-muted rounded mb-8"></div>
            <div className="h-32 bg-muted rounded mb-8"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
