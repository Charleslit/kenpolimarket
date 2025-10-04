'use client';

const CACHE_NAME = 'kenpolimarket-v1';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: any;
  timestamp: number;
  key: string;
}

export class OfflineStorage {
  private static instance: OfflineStorage;

  private constructor() {}

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // Save data to localStorage with timestamp
  async saveData(key: string, data: any): Promise<void> {
    try {
      const cachedData: CachedData = {
        data,
        timestamp: Date.now(),
        key,
      };
      localStorage.setItem(`${CACHE_NAME}:${key}`, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Failed to save data to offline storage:', error);
    }
  }

  // Get data from localStorage
  async getData(key: string, maxAge: number = CACHE_EXPIRY): Promise<any | null> {
    try {
      const item = localStorage.getItem(`${CACHE_NAME}:${key}`);
      if (!item) return null;

      const cachedData: CachedData = JSON.parse(item);
      const age = Date.now() - cachedData.timestamp;

      if (age > maxAge) {
        // Data is too old, remove it
        this.removeData(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error('Failed to get data from offline storage:', error);
      return null;
    }
  }

  // Remove specific data
  async removeData(key: string): Promise<void> {
    try {
      localStorage.removeItem(`${CACHE_NAME}:${key}`);
    } catch (error) {
      console.error('Failed to remove data from offline storage:', error);
    }
  }

  // Clear all cached data
  async clearAll(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_NAME)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
    }
  }

  // Get cache size
  getCacheSize(): number {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_NAME)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += item.length;
        }
      }
    });
    return size;
  }

  // Check if data exists and is fresh
  async isFresh(key: string, maxAge: number = CACHE_EXPIRY): Promise<boolean> {
    const data = await this.getData(key, maxAge);
    return data !== null;
  }
}

// Hook for using offline storage
export function useOfflineStorage() {
  const storage = OfflineStorage.getInstance();

  const saveOffline = async (key: string, data: any) => {
    await storage.saveData(key, data);
  };

  const getOffline = async (key: string, maxAge?: number) => {
    return await storage.getData(key, maxAge);
  };

  const removeOffline = async (key: string) => {
    await storage.removeData(key);
  };

  const clearOffline = async () => {
    await storage.clearAll();
  };

  return {
    saveOffline,
    getOffline,
    removeOffline,
    clearOffline,
  };
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Fetch with offline fallback
export async function fetchWithOffline<T>(
  url: string,
  cacheKey: string,
  options?: RequestInit
): Promise<T> {
  const storage = OfflineStorage.getInstance();

  try {
    // Try to fetch from network
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();

    // Save to offline storage
    await storage.saveData(cacheKey, data);

    return data;
  } catch (error) {
    console.warn('Network request failed, trying offline cache:', error);

    // Try to get from offline storage
    const cachedData = await storage.getData(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return cachedData;
    }

    throw new Error('No data available offline');
  }
}

// Import useState and useEffect
import { useState, useEffect } from 'react';

