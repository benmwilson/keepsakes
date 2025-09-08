import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Settings, Users, Upload } from "lucide-react";

export default function SetupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 text-green-600 rounded-full p-3 w-fit mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Setup Complete!</CardTitle>
            <CardDescription className="text-lg">
              Your Keepsakes app is ready to use
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your memory wall has been configured and is ready for your event. 
                You can now start sharing the link with your guests!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="p-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Share with Guests</h3>
                  <p className="text-sm text-muted-foreground">
                    Send the memory wall link to your guests
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-4">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Upload Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Test the upload functionality
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-4">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Manage Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust settings in the admin panel
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Next Steps:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Your event has been created</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Admin account has been set up</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Security settings have been configured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Display preferences have been set</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Admin Panel
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="flex-1">
                <Link href="/wall">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Memory Wall
                </Link>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Need help? Check out the{" "}
                <Link href="/about" className="text-primary hover:underline">
                  about page
                </Link>{" "}
                for more information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
