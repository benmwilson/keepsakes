"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser } from "@/actions/admin-users";
import { initializeSiteConfig } from "@/lib/auth-config";
import type { Event } from "@/lib/types";

type SerializableEvent = Omit<Event, "createdAt" | "restartAutoplay"> & { createdAt: string, restartAutoplay?: string };

interface CreateAdminUserProps {
  event: SerializableEvent;
  onCreated: () => void;
}

export default function CreateAdminUser({ event, onCreated }: CreateAdminUserProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sitePassword, setSitePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSitePassword, setShowSitePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, initialize the site configuration with the site password
      if (sitePassword.trim()) {
        await initializeSiteConfig(sitePassword);
      }

      // Then create the admin user
      const result = await createAdminUser(username, password, event.id);
      
      if (result.success) {
        toast({
          title: "Admin user created successfully!",
          description: sitePassword.trim() 
            ? "Your admin account and site password protection have been set up." 
            : "Please log in with your credentials to access the dashboard.",
        });
        onCreated();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create admin user.",
          variant: "destructive",
        });
        // If admin user already exists, redirect to login
        if (result.error === "Admin user already exists for this event") {
          onCreated();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin user. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
            <User className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-2xl">Create Admin User</CardTitle>
          <CardDescription>
            Create the first admin user for "{event.name}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin User Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Admin Account
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={isLoading}
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Site Password Protection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4" />
                Site Password Protection
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sitePassword">Site Access Password</Label>
                <div className="relative">
                  <Input
                    id="sitePassword"
                    type={showSitePassword ? "text" : "password"}
                    value={sitePassword}
                    onChange={(e) => setSitePassword(e.target.value)}
                    placeholder="Enter site password (optional)"
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSitePassword(!showSitePassword)}
                    disabled={isLoading}
                  >
                    {showSitePassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This password will be required for guests to access the site. Leave blank to disable password protection.
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? "Creating..." : "Create Admin User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
