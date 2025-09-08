"use client";

import { useEffect } from 'react';

interface UseDocumentTitleOptions {
  title: string;
  restoreOnUnmount?: boolean;
}

export function useDocumentTitle({ title, restoreOnUnmount = true }: UseDocumentTitleOptions) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title;

    if (restoreOnUnmount) {
      return () => {
        document.title = originalTitle;
      };
    }
  }, [title, restoreOnUnmount]);
}
