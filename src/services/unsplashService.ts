import axios from 'axios';
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
  async searchPhotos(query: string, options?: {
    page?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
    orderBy?: 'latest' | 'relevant';
  }): Promise<UnsplashSearchResult> {
    try {
      const response = await axios.post(`${this.proxyEndpoint}/search-photos`, {
        query,
        options,
      });
      return response.data;
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
      const response = await axios.post(`${this.proxyEndpoint}/get-random-photo`, {
        options,
      });
      return response.data.photos;
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
      const response = await axios.get(`${this.proxyEndpoint}/get-photo/${photoId}`);
      return response.data;
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
      await axios.post(`${this.proxyEndpoint}/track-download`, { downloadLocation });
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
      const response = await axios.post(`${this.proxyEndpoint}/list-photos`, {
        options: {
          ...options,
          type: 'trending' // Add a type to differentiate on the proxy
        }
      });
      return response.data.results;
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
      const response = await axios.post(`${this.proxyEndpoint}/list-collections`, {
        options,
      });
      return response.data.results;
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
      const response = await axios.post(`${this.proxyEndpoint}/get-collection-photos/${collectionId}`, {
        options,
      });
      return response.data.results;
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
      const response = await axios.post(`${this.proxyEndpoint}/list-topics`, {
        options,
      });
      return response.data.results;
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
      const response = await axios.post(`${this.proxyEndpoint}/get-topic-photos/${topicIdOrSlug}`, {
        options,
      });
      return response.data.results;
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
      const response = await axios.post(`${this.proxyEndpoint}/get-user-photos/${username}`, {
        options,
      });
      return response.data.results;
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
