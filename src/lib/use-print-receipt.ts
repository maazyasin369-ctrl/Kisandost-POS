'use client';

import { useRef, useCallback, useEffect } from 'react';

export function usePrintReceipt(onAfterPrint?: () => void) {
  const isPrintingRef = useRef(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      isPrintingRef.current = false;
      if (onAfterPrint) {
        onAfterPrint();
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onAfterPrint]);

  const triggerPrint = useCallback(() => {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    
    // Request animation frame ensures DOM render before print dialog opens
    requestAnimationFrame(() => {
      window.print();
      // Fallback reset in case afterprint does not fire on some browsers
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 1000);
    });
  }, []);

  return { triggerPrint, isPrinting: isPrintingRef.current };
}
