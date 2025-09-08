"use client";

import { useEffect, useRef } from 'react';

interface UseFormActivityOptions {
  pauseDatabaseChecks?: boolean;
}

export function useFormActivity({ pauseDatabaseChecks = true }: UseFormActivityOptions = {}) {
  const isFormActiveRef = useRef(false);

  const startFormActivity = () => {
    isFormActiveRef.current = true;
    if (pauseDatabaseChecks) {
      // Dispatch custom event to pause database checks
      window.dispatchEvent(new CustomEvent('pauseDatabaseChecks'));
    }
  };

  const endFormActivity = () => {
    isFormActiveRef.current = false;
    if (pauseDatabaseChecks) {
      // Dispatch custom event to resume database checks
      window.dispatchEvent(new CustomEvent('resumeDatabaseChecks'));
    }
  };

  // Auto-detect form interactions
  useEffect(() => {
    const handleFormFocus = () => startFormActivity();
    const handleFormBlur = () => {
      // Delay ending form activity to handle tab navigation
      setTimeout(() => {
        if (!document.activeElement || 
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
          endFormActivity();
        }
      }, 100);
    };

    // Listen for form element interactions
    document.addEventListener('focusin', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element).tagName)) {
        handleFormFocus();
      }
    });

    document.addEventListener('focusout', handleFormBlur);

    return () => {
      document.removeEventListener('focusin', handleFormFocus);
      document.removeEventListener('focusout', handleFormBlur);
    };
  }, []);

  return {
    startFormActivity,
    endFormActivity,
    isFormActive: isFormActiveRef.current,
  };
}
