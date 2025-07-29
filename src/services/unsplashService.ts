import axios from 'axios';
import { logger } from '../utils/logger';
// import { createApi } from 'unsplash-js'; // This is no longer needed as we are proxying all requests.

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
  private proxyEndpoint: string;

  constructor() {
    this.proxyEndpoint = '/api/unsplash';
  }
  /**
   * Search for photos on Unsplash
   */
  async searchPhotos(
    query: string,
    options?: {
      page?: number;
      perPage?: number;
      orientation?: 'landscape' | 'portrait' | 'squarish';
      orderBy?: 'latest' | 'relevant';
    },
  ): Promise<UnsplashSearchResult> {
    /**
     * Search for photos on Unsplash
     * @param query The search query string.
     * @param options Optional parameters for the search.
     * @returns A promise that resolves to an UnsplashSearchResult object.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/search-photos`, {
        query,
        options,
      });
      return response.data;
    } catch (error) {
      logger.error('Error searching Unsplash photos:', error);
      throw error; // Re-throw to allow calling components to handle
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
    /**
     * Get a random photo from Unsplash.
     * @param options Optional parameters for getting a random photo.
     * @returns A promise that resolves to an array of UnsplashPhoto objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/get-random-photo`, {
        options,
      });
      return response.data.photos;
    } catch (error) {
      logger.error('Error getting random Unsplash photo:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Get a specific photo by ID
   */
  async getPhoto(photoId: string): Promise<UnsplashPhoto> {
    /**
     * Get a specific photo by ID from Unsplash.
     * @param photoId The ID of the photo to retrieve.
     * @returns A promise that resolves to an UnsplashPhoto object.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.get(`${this.proxyEndpoint}/get-photo/${photoId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting Unsplash photo:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Track a photo download (required by Unsplash API guidelines)
   */
  async trackDownload(downloadLocation: string): Promise<void> {
    try {
      await axios.post(`${this.proxyEndpoint}/track-download`, { downloadLocation });
    } catch (error) {
      logger.error('Error tracking download:', error);
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
    /**
     * Get trending photos from Unsplash.
     * @param options Optional parameters for listing photos.
     * @returns A promise that resolves to an array of UnsplashPhoto objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/list-photos`, {
        options: {
          ...options,
          type: 'trending', // Add a type to differentiate on the proxy
        },
      });
      return response.data.results;
    } catch (error) {
      logger.error('Error getting trending Unsplash photos:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Get collections
   */
  async getCollections(options?: {
    page?: number;
    perPage?: number;
  }): Promise<UnsplashCollection[]> {
    /**
     * Get collections from Unsplash.
     * @param options Optional parameters for listing collections.
     * @returns A promise that resolves to an array of UnsplashCollection objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/list-collections`, {
        options,
      });
      return response.data.results;
    } catch (error) {
      logger.error('Error getting Unsplash collections:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Get photos from a specific collection
   */
  async getCollectionPhotos(
    collectionId: string,
    options?: {
      page?: number;
      perPage?: number;
      orientation?: 'landscape' | 'portrait' | 'squarish';
    },
  ): Promise<UnsplashPhoto[]> {
    /**
     * Get photos from a specific collection on Unsplash.
     * @param collectionId The ID of the collection.
     * @param options Optional parameters for listing collection photos.
     * @returns A promise that resolves to an array of UnsplashPhoto objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(
        `${this.proxyEndpoint}/get-collection-photos/${collectionId}`,
        {
          options,
        },
      );
      return response.data.results;
    } catch (error) {
      logger.error('Error getting collection photos:', error);
      throw error; // Re-throw to allow calling components to handle
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
    /**
     * Get topics from Unsplash.
     * @param options Optional parameters for listing topics.
     * @returns A promise that resolves to an array of UnsplashTopic objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/list-topics`, {
        options,
      });
      return response.data.results;
    } catch (error) {
      logger.error('Error getting Unsplash topics:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Get photos from a specific topic
   */
  async getTopicPhotos(
    topicIdOrSlug: string,
    options?: {
      page?: number;
      perPage?: number;
      orientation?: 'landscape' | 'portrait' | 'squarish';
    },
  ): Promise<UnsplashPhoto[]> {
    /**
     * Get photos from a specific topic on Unsplash.
     * @param topicIdOrSlug The ID or slug of the topic.
     * @param options Optional parameters for listing topic photos.
     * @returns A promise that resolves to an array of UnsplashPhoto objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/get-topic-photos/${topicIdOrSlug}`, {
        options,
      });
      return response.data.results;
    } catch (error) {
      logger.error('Error getting topic photos:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Get user photos
   */
  async getUserPhotos(
    username: string,
    options?: {
      page?: number;
      perPage?: number;
      orderBy?: 'latest' | 'oldest';
      orientation?: 'landscape' | 'portrait' | 'squarish';
    },
  ): Promise<UnsplashPhoto[]> {
    /**
     * Get user photos from Unsplash.
     * @param username The username of the Unsplash user.
     * @param options Optional parameters for listing user photos.
     * @returns A promise that resolves to an array of UnsplashPhoto objects.
     * @throws Throws an error if the API call fails.
     */
    try {
      const response = await axios.post(`${this.proxyEndpoint}/get-user-photos/${username}`, {
        options,
      });
      return response.data.results;
    } catch (error) {
      logger.error('Error getting user photos:', error);
      throw error; // Re-throw to allow calling components to handle
    }
  }

  /**
   * Utility function to get a photo URL with specific dimensions
   */
  getPhotoUrl(
    photo: UnsplashPhoto,
    size: 'raw' | 'full' | 'regular' | 'small' | 'thumb' = 'regular',
  ): string {
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
