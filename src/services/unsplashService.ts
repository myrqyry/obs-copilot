import { createApi } from 'unsplash-js';

// Initialize the Unsplash API client
const unsplash = createApi({
  accessKey: import.meta.env.VITE_UNSPLASH_API_KEY || 'GqhQpfUrY4oRiqm2WXhIJityjcA5HsFHE5OjjtWvJF4',
});

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
    html: string;
  };
  width: number;
  height: number;
  color: string;
  likes: number;
}

export interface UnsplashSearchResult {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

export interface UnsplashCollection {
  id: string;
  title: string;
  description: string;
  cover_photo: UnsplashPhoto;
  total_photos: number;
  user: {
    name: string;
    username: string;
  };
}

export interface UnsplashTopic {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_photo: UnsplashPhoto;
  total_photos: number;
}

class UnsplashService {
  /**
   * Search for photos on Unsplash
   */
  async searchPhotos(query: string, options?: {
    page?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    orderBy?: 'latest' | 'relevant';
  }): Promise<UnsplashSearchResult> {
    try {
      const result = await unsplash.search.getPhotos({
        query,
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        orientation: options?.orientation,
        orderBy: options?.orderBy || 'relevant',
      });

      if (result.type === 'success') {
        return {
          results: result.response.results as UnsplashPhoto[],
          total: result.response.total,
          total_pages: result.response.total_pages,
        };
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error searching Unsplash photos:', error);
      throw error;
    }
  }

  /**
   * Get a random photo
   */
  async getRandomPhoto(options?: {
    query?: string;
    count?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    featured?: boolean;
    username?: string;
    collectionIds?: string[];
    topicIds?: string[];
  }): Promise<UnsplashPhoto[]> {
    try {
      const result = await unsplash.photos.getRandom({
        query: options?.query,
        count: options?.count || 1,
        orientation: options?.orientation,
        featured: options?.featured,
        username: options?.username,
        collectionIds: options?.collectionIds,
        topicIds: options?.topicIds,
      });

      if (result.type === 'success') {
        return Array.isArray(result.response) 
          ? result.response as UnsplashPhoto[]
          : [result.response as UnsplashPhoto];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting random Unsplash photo:', error);
      throw error;
    }
  }

  /**
   * Get a specific photo by ID
   */
  async getPhoto(photoId: string): Promise<UnsplashPhoto> {
    try {
      const result = await unsplash.photos.get({ photoId });

      if (result.type === 'success') {
        return result.response as UnsplashPhoto;
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting Unsplash photo:', error);
      throw error;
    }
  }

  /**
   * Track a photo download (required by Unsplash API guidelines)
   */
  async trackDownload(downloadLocation: string): Promise<void> {
    try {
      await unsplash.photos.trackDownload({ downloadLocation });
    } catch (error) {
      console.error('Error tracking download:', error);
      // Don't throw error for tracking failures as it's not critical
    }
  }

  /**
   * Get trending photos
   */
  async getTrendingPhotos(options?: {
    page?: number;
    perPage?: number;
    orderBy?: 'latest' | 'oldest';
  }): Promise<UnsplashPhoto[]> {
    try {
      const result = await unsplash.photos.list({
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        orderBy: options?.orderBy as any || 'latest',
      });

      if (result.type === 'success') {
        return result.response.results as UnsplashPhoto[];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting trending Unsplash photos:', error);
      throw error;
    }
  }

  /**
   * Get collections
   */
  async getCollections(options?: {
    page?: number;
    perPage?: number;
  }): Promise<UnsplashCollection[]> {
    try {
      const result = await unsplash.collections.list({
        page: options?.page || 1,
        perPage: options?.perPage || 20,
      });

      if (result.type === 'success') {
        return result.response.results as UnsplashCollection[];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting Unsplash collections:', error);
      throw error;
    }
  }

  /**
   * Get photos from a specific collection
   */
  async getCollectionPhotos(collectionId: string, options?: {
    page?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
  }): Promise<UnsplashPhoto[]> {
    try {
      const result = await unsplash.collections.getPhotos({
        collectionId,
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        orientation: options?.orientation,
      });

      if (result.type === 'success') {
        return result.response.results as UnsplashPhoto[];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting collection photos:', error);
      throw error;
    }
  }

  /**
   * Get topics
   */
  async getTopics(options?: {
    page?: number;
    perPage?: number;
    orderBy?: 'latest' | 'oldest' | 'featured' | 'position';
  }): Promise<UnsplashTopic[]> {
    try {
      const result = await unsplash.topics.list({
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        orderBy: options?.orderBy as any || 'position',
      });

      if (result.type === 'success') {
        return result.response.results as UnsplashTopic[];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting Unsplash topics:', error);
      throw error;
    }
  }

  /**
   * Get photos from a specific topic
   */
  async getTopicPhotos(topicIdOrSlug: string, options?: {
    page?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
  }): Promise<UnsplashPhoto[]> {
    try {
      const result = await unsplash.topics.getPhotos({
        topicIdOrSlug,
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        orientation: options?.orientation,
      });

      if (result.type === 'success') {
        return result.response.results as UnsplashPhoto[];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting topic photos:', error);
      throw error;
    }
  }

  /**
   * Get user photos
   */
  async getUserPhotos(username: string, options?: {
    page?: number;
    perPage?: number;
    orderBy?: 'latest' | 'oldest';
    orientation?: 'landscape' | 'portrait' | 'squarish';
  }): Promise<UnsplashPhoto[]> {
    try {
      const result = await unsplash.users.getPhotos({
        username,
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        orderBy: options?.orderBy as any || 'latest',
        orientation: options?.orientation,
      });

      if (result.type === 'success') {
        return result.response.results as UnsplashPhoto[];
      } else {
        throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Error getting user photos:', error);
      throw error;
    }
  }

  /**
   * Utility function to get a photo URL with specific dimensions
   */
  getPhotoUrl(photo: UnsplashPhoto, size: 'raw' | 'full' | 'regular' | 'small' | 'thumb' = 'regular'): string {
    return photo.urls[size];
  }

  /**
   * Utility function to get photo attribution HTML
   */
  getPhotoAttribution(photo: UnsplashPhoto): string {
    return `Photo by <a href="${photo.user.links.html}?utm_source=obs_copilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=obs_copilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
  }
}

// Export a singleton instance
export const unsplashService = new UnsplashService();
export default unsplashService; 