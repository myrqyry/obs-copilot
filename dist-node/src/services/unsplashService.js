import axios from 'axios';
class UnsplashService {
    proxyEndpoint;
    constructor() {
        this.proxyEndpoint = '/api/unsplash';
    }
    /**
     * Search for photos on Unsplash
     */
    async searchPhotos(query, options) {
        try {
            const response = await axios.post(`${this.proxyEndpoint}/search-photos`, {
                query,
                options,
            });
            return response.data;
        }
        catch (error) {
            console.error('Error searching Unsplash photos:', error);
            throw error;
        }
    }
    /**
     * Get a random photo
     */
    async getRandomPhoto(options) {
        try {
            const response = await axios.post(`${this.proxyEndpoint}/get-random-photo`, {
                options,
            });
            return response.data.photos;
        }
        catch (error) {
            console.error('Error getting random Unsplash photo:', error);
            throw error;
        }
    }
    /**
     * Get a specific photo by ID
     */
    async getPhoto(photoId) {
        try {
            const response = await axios.get(`${this.proxyEndpoint}/get-photo/${photoId}`);
            return response.data;
        }
        catch (error) {
            console.error('Error getting Unsplash photo:', error);
            throw error;
        }
    }
    /**
     * Track a photo download (required by Unsplash API guidelines)
     */
    async trackDownload(downloadLocation) {
        try {
            await axios.post(`${this.proxyEndpoint}/track-download`, { downloadLocation });
        }
        catch (error) {
            console.error('Error tracking download:', error);
            // Don't throw error for tracking failures as it's not critical
        }
    }
    /**
     * Get trending photos
     */
    async getTrendingPhotos(options) {
        try {
            const result = await unsplash.photos.list({
                page: options?.page || 1,
                perPage: options?.perPage || 20,
                orderBy: options?.orderBy || 'latest',
            });
            if (result.type === 'success') {
                return result.response.results;
            }
            else {
                throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error getting trending Unsplash photos:', error);
            throw error;
        }
    }
    /**
     * Get collections
     */
    async getCollections(options) {
        try {
            const result = await unsplash.collections.list({
                page: options?.page || 1,
                perPage: options?.perPage || 20,
            });
            if (result.type === 'success') {
                return result.response.results;
            }
            else {
                throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error getting Unsplash collections:', error);
            throw error;
        }
    }
    /**
     * Get photos from a specific collection
     */
    async getCollectionPhotos(collectionId, options) {
        try {
            const result = await unsplash.collections.getPhotos({
                collectionId,
                page: options?.page || 1,
                perPage: options?.perPage || 20,
                orientation: options?.orientation,
            });
            if (result.type === 'success') {
                return result.response.results;
            }
            else {
                throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error getting collection photos:', error);
            throw error;
        }
    }
    /**
     * Get topics
     */
    async getTopics(options) {
        try {
            const result = await unsplash.topics.list({
                page: options?.page || 1,
                perPage: options?.perPage || 20,
                orderBy: options?.orderBy || 'position',
            });
            if (result.type === 'success') {
                return result.response.results;
            }
            else {
                throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error getting Unsplash topics:', error);
            throw error;
        }
    }
    /**
     * Get photos from a specific topic
     */
    async getTopicPhotos(topicIdOrSlug, options) {
        try {
            const result = await unsplash.topics.getPhotos({
                topicIdOrSlug,
                page: options?.page || 1,
                perPage: options?.perPage || 20,
                orientation: options?.orientation,
            });
            if (result.type === 'success') {
                return result.response.results;
            }
            else {
                throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error getting topic photos:', error);
            throw error;
        }
    }
    /**
     * Get user photos
     */
    async getUserPhotos(username, options) {
        try {
            const result = await unsplash.users.getPhotos({
                username,
                page: options?.page || 1,
                perPage: options?.perPage || 20,
                orderBy: options?.orderBy || 'latest',
                orientation: options?.orientation,
            });
            if (result.type === 'success') {
                return result.response.results;
            }
            else {
                throw new Error(`Unsplash API error: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error getting user photos:', error);
            throw error;
        }
    }
    /**
     * Utility function to get a photo URL with specific dimensions
     */
    getPhotoUrl(photo, size = 'regular') {
        return photo.urls[size];
    }
    /**
     * Utility function to get photo attribution HTML
     */
    getPhotoAttribution(photo) {
        return `Photo by <a href="${photo.user.links.html}?utm_source=obs_copilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=obs_copilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
    }
}
// Export a singleton instance
export const unsplashService = new UnsplashService();
export default unsplashService;
