
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MotionDiv } from "@/components/motion";
import GA4PageView from "@/components/ga4-page-view";
import { AuthProvider } from "@/lib/auth-context";
import { DatabaseProvider } from "@/lib/database-context";
import AuthWrapper from "@/components/auth-wrapper";
import { DatabaseErrorBoundary } from "@/components/database-error-boundary";

export const metadata: Metadata = {
  title: "Keepsakes",
  description: "A shared memory wall for your special events.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-screen flex flex-col overflow-x-hidden" suppressHydrationWarning={true}>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
          `}
        </Script>
        
        <DatabaseProvider>
          <AuthProvider>
            <AuthWrapper>
              <DatabaseErrorBoundary>
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex-1 flex flex-col"
                >
                  <Suspense fallback={null}>
                    <GA4PageView />
                  </Suspense>
                  {children}
                </MotionDiv>
              </DatabaseErrorBoundary>
            </AuthWrapper>
          </AuthProvider>
        </DatabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
