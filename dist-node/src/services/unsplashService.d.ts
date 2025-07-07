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
declare class UnsplashService {
    private proxyEndpoint;
    constructor();
    /**
     * Search for photos on Unsplash
     */
    searchPhotos(query: string, options?: {
        page?: number;
        perPage?: number;
        orientation?: 'landscape' | 'portrait' | 'squarish';
        orderBy?: 'latest' | 'relevant';
    }): Promise<UnsplashSearchResult>;
    /**
     * Get a random photo
     */
    getRandomPhoto(options?: {
        query?: string;
        count?: number;
        orientation?: 'landscape' | 'portrait' | 'squarish';
        featured?: boolean;
        username?: string;
        collectionIds?: string[];
        topicIds?: string[];
    }): Promise<UnsplashPhoto[]>;
    /**
     * Get a specific photo by ID
     */
    getPhoto(photoId: string): Promise<UnsplashPhoto>;
    /**
     * Track a photo download (required by Unsplash API guidelines)
     */
    trackDownload(downloadLocation: string): Promise<void>;
    /**
     * Get trending photos
     */
    getTrendingPhotos(options?: {
        page?: number;
        perPage?: number;
        orderBy?: 'latest' | 'oldest';
    }): Promise<UnsplashPhoto[]>;
    /**
     * Get collections
     */
    getCollections(options?: {
        page?: number;
        perPage?: number;
    }): Promise<UnsplashCollection[]>;
    /**
     * Get photos from a specific collection
     */
    getCollectionPhotos(collectionId: string, options?: {
        page?: number;
        perPage?: number;
        orientation?: 'landscape' | 'portrait' | 'squarish';
    }): Promise<UnsplashPhoto[]>;
    /**
     * Get topics
     */
    getTopics(options?: {
        page?: number;
        perPage?: number;
        orderBy?: 'latest' | 'oldest' | 'featured' | 'position';
    }): Promise<UnsplashTopic[]>;
    /**
     * Get photos from a specific topic
     */
    getTopicPhotos(topicIdOrSlug: string, options?: {
        page?: number;
        perPage?: number;
        orientation?: 'landscape' | 'portrait' | 'squarish';
    }): Promise<UnsplashPhoto[]>;
    /**
     * Get user photos
     */
    getUserPhotos(username: string, options?: {
        page?: number;
        perPage?: number;
        orderBy?: 'latest' | 'oldest';
        orientation?: 'landscape' | 'portrait' | 'squarish';
    }): Promise<UnsplashPhoto[]>;
    /**
     * Utility function to get a photo URL with specific dimensions
     */
    getPhotoUrl(photo: UnsplashPhoto, size?: 'raw' | 'full' | 'regular' | 'small' | 'thumb'): string;
    /**
     * Utility function to get photo attribution HTML
     */
    getPhotoAttribution(photo: UnsplashPhoto): string;
}
export declare const unsplashService: UnsplashService;
export default unsplashService;
