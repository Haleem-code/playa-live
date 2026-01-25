import { GAMING_STREAM_IMAGES } from '@/constants/stream-images';

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const API_URL = 'https://api.unsplash.com/photos/random';

class UnsplashService {
  private cache: string[] = [];
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize with fallback images immediately
    this.cache = [...GAMING_STREAM_IMAGES];
  }

  /**
   * Fetches a batch of gaming images from Unsplash to populate the cache.
   * This should be called once on app load or when needed.
   */
  async initialize(count: number = 20): Promise<void> {
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not found, using fallback images.');
      return;
    }

    if (this.isInitialized) return;
    
    // Prevent multiple simultaneous init calls
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}?client_id=${UNSPLASH_ACCESS_KEY}&query=gaming&count=${count}&orientation=landscape`);
        
        if (!response.ok) {
           if (response.status === 403 || response.status === 429) {
             console.warn('Unsplash Rate Limit Exceeded or Forbidden');
           }
           throw new Error(`Unsplash API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const urls = data.map((img: any) => img.urls.regular);
        
        // Combine with fallback images or replace? 
        // Let's prepend them so they are used first, but keep fallbacks just in case we run out (unlikely with modulo)
        this.cache = [...urls, ...GAMING_STREAM_IMAGES];
        this.isInitialized = true;
        console.log('Unsplash service initialized with', urls.length, 'images');
        
      } catch (error) {
        console.error('Failed to strict-init Unsplash service:', error);
        // Fallback is already set in constructor
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Returns a deterministic random image URL based on a seed string (e.g. stream ID).
   */
  getImage(seed: string): string {
    // Determine index from seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.cache.length;
    return this.cache[index];
  }

  /**
   * Returns a purely random image from the cache.
   */
  getRandomImage(): string {
     const index = Math.floor(Math.random() * this.cache.length);
     return this.cache[index];
  }
}

export const unsplashService = new UnsplashService();
