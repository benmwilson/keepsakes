"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Declare gtag function for Google Analytics
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, any>) => void;
  }
}

export default function GA4PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    if (window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, { page_path: url });
    }
  }, [pathname, searchParams]);

  return null;
}
