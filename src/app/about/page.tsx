import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Camera, Video, FileText, Users, Shield, Download } from "lucide-react";
import SharedLayout from "@/components/shared-layout";

export default function AboutPage() {
  return (
    <SharedLayout
      pageType="terms"
      showHeader={true}
      uploadHref="/upload"
      eventSlug={undefined}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline mb-4">
            About Keepsakes
          </h1>
          <h4 className="text-2xl text-center text-muted-foreground/80 max-w-2xl mx-auto mb-2">
            The Interactive Memory Wall
          </h4>
          <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto">
            A special birthday gift for my dad - a collection of memories from family and friends
          </p>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* What is this */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                What is This?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">
                Hi! I'm Ben, and I created this digital memory wall as a special birthday gift for my dad. 
                It's a way for family and friends to share photos, videos, and heartfelt messages to celebrate his special day.
              </p>
              <p className="text-lg leading-relaxed">
                This isn't spam or a commercial service - it's a personal project I built specifically for this occasion. 
                Think of it as a modern, digital version of a birthday card or photo album that everyone can contribute to!
              </p>
            </CardContent>
          </Card>

                     {/* How it works */}
           <Card>
             <CardHeader>
               <CardTitle className="text-2xl">How It Works</CardTitle>
               <CardDescription>A simple way to contribute to my dad's birthday celebration</CardDescription>
             </CardHeader>
                           <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-bold text-lg">1</span>
                    </div>
                    <h3 className="font-semibold text-lg">Click "Upload a Keepsake"</h3>
                    <p className="text-muted-foreground">
                      Use the button on the homepage to start sharing your memories, photos, or birthday wishes.
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-bold text-lg">2</span>
                    </div>
                    <h3 className="font-semibold text-lg">Share Your Memories</h3>
                    <p className="text-muted-foreground">
                      Upload photos, videos, or write a heartfelt message. You can include your name if you'd like!
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-bold text-lg">3</span>
                    </div>
                    <h3 className="font-semibold text-lg">View the Memory Wall</h3>
                    <p className="text-muted-foreground">
                      See all the birthday wishes and memories in a beautiful slideshow or grid layout.
                    </p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-primary font-bold text-lg">4</span>
                    </div>
                    <h3 className="font-semibold text-lg">Get the Gallery Later</h3>
                    <p className="text-muted-foreground">
                      Optionally sign up to receive the complete memory gallery after the birthday celebration ends.
                    </p>
                  </div>
                </div>
              </CardContent>
           </Card>

                     {/* Features */}
           <Card>
             <CardHeader>
               <CardTitle className="text-2xl">What You Can Share</CardTitle>
               <CardDescription>Different ways to contribute to the birthday celebration</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <div className="flex items-start gap-3">
                     <Camera className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                     <div>
                       <h4 className="font-semibold">Photos & Videos</h4>
                       <p className="text-muted-foreground text-sm">
                         Share old family photos, recent memories, or record a birthday video message.
                       </p>
                     </div>
                   </div>
                   <div className="flex items-start gap-3">
                     <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                     <div>
                       <h4 className="font-semibold">Birthday Messages</h4>
                       <p className="text-muted-foreground text-sm">
                         Write a heartfelt birthday wish, share a funny memory, or express your love and appreciation.
                       </p>
                     </div>
                   </div>
                   <div className="flex items-start gap-3">
                     <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                     <div>
                       <h4 className="font-semibold">Personal Touch</h4>
                       <p className="text-muted-foreground text-sm">
                         Include your name so my dad knows who each message is from. It makes it more personal!
                       </p>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <div className="flex items-start gap-3">
                     <Video className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                     <div>
                       <h4 className="font-semibold">Beautiful Display</h4>
                       <p className="text-muted-foreground text-sm">
                         All contributions are displayed in a beautiful slideshow or organized grid layout.
                       </p>
                     </div>
                   </div>
                                       <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">Personal Project</h4>
                        <p className="text-muted-foreground text-sm">
                          Built with love as a birthday gift - no commercial purpose, just a way to bring people together.
                        </p>
                      </div>
                    </div>
                   <div className="flex items-start gap-3">
                     <Download className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                     <div>
                       <h4 className="font-semibold">Easy to Use</h4>
                       <p className="text-muted-foreground text-sm">
                         Simple upload process - just drag and drop or click to select your photos and videos.
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>

                     {/* About me */}
           <Card>
             <CardHeader>
               <CardTitle className="text-2xl">About Me</CardTitle>
               <CardDescription>A bit about who I am and why I built this</CardDescription>
             </CardHeader>
                           <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed">
                  Hey, I'm Ben Wilson! I'm a freelance web developer and creative technologist based in Kelowna, British Columbia. 
                  I work as a Web Developer at Vigilante Marketing during the day, and I do freelance web development, design, 
                  and custom programming under Wilson Creative.
                </p>
                <p className="text-lg leading-relaxed">
                  With a foundation in full-stack web development, I'm passionate about design, seamless UX, and automation. 
                  When I was thinking about what to get my dad for his birthday, I wanted to create something special that 
                  would let all the people who love him share their memories and birthday wishes.
                </p>
                <p className="text-lg leading-relaxed">
                  This isn't a commercial product or service - it's a personal project I built specifically for this occasion. 
                  I wanted to create a beautiful, easy-to-use way for family and friends to contribute to my dad's birthday 
                  celebration, even if they can't be there in person.
                </p>
                <p className="text-lg leading-relaxed">
                  I hope this memory wall becomes a special keepsake that my dad can look back on and remember all the love 
                  and well-wishes from the people who care about him.
                </p>
              </CardContent>
           </Card>

                     {/* CTA */}
           <Card className="text-center">
             <CardContent className="pt-6">
               <h3 className="text-2xl font-bold mb-4">Ready to Share Your Birthday Wishes?</h3>
               <p className="text-muted-foreground mb-6">
                 Help make my dad's birthday extra special by contributing your memories and messages
               </p>
               <Link href="/">
                 <Button size="lg" className="px-8">
                   Upload a Keepsake
                 </Button>
               </Link>
             </CardContent>
           </Card>
        </div>
      </div>
    </SharedLayout>
  );
}
