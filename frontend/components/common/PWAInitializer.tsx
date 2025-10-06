'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/pwaUtils';

/**
 * PWA Initializer Component
 * Registers service worker on mount
 */
export default function PWAInitializer() {
  useEffect(() => {
    // Register service worker
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return null; // This component doesn't render anything
}

