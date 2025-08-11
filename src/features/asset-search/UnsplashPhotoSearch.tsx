import React, { useState } from 'react';
import { unsplashService, UnsplashPhoto } from '@/services/unsplashService';

interface UnsplashPhotoSearchProps {
  onPhotoSelect?: (photo: UnsplashPhoto) => void;
  className?: string;
}

export const UnsplashPhotoSearch: React.FC<UnsplashPhotoSearchProps> = ({
  onPhotoSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);

  const searchPhotos = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await unsplashService.searchPhotos(searchQuery, {
        perPage: 20,
        orderBy: 'relevant',
      });
      setPhotos(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPhotos(query);
  };

  const handlePhotoClick = (photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
    onPhotoSelect?.(photo);
    
    // Track download for Unsplash API compliance
    unsplashService.trackDownload(photo.links.download_location);
  };

  const handleRandomPhoto = async () => {
    setLoading(true);
    setError(null);

    try {
      const randomPhotos = await unsplashService.getRandomPhoto({
        count: 1,
        featured: true,
      });
      if (randomPhotos.length > 0) {
        setSelectedPhoto(randomPhotos[0]);
        onPhotoSelect?.(randomPhotos[0]);
        unsplashService.trackDownload(randomPhotos[0].links.download_location);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get random photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`unsplash-photo-search ${className}`}>
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for photos..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleRandomPhoto}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Random
          </button>
        </form>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}
      </div>

      {/* Selected Photo Display */}
      {selectedPhoto && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Selected Photo</h3>
          <div className="relative">
            <img
              src={unsplashService.getPhotoUrl(selectedPhoto, 'regular')}
              alt={selectedPhoto.alt_description || 'Selected photo'}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="mt-2 text-sm text-gray-600">
              <div dangerouslySetInnerHTML={{ 
                __html: unsplashService.getPhotoAttribution(selectedPhoto) 
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">Search Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                onClick={() => handlePhotoClick(photo)}
              >
                <img
                  src={unsplashService.getPhotoUrl(photo, 'small')}
                  alt={photo.alt_description || 'Unsplash photo'}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
                  <div className="p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="font-medium">{photo.user.name}</div>
                    <div className="text-gray-200">
                      {photo.likes} likes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && query && !error && (
        <div className="text-center py-8 text-gray-500">
          No photos found for "{query}"
        </div>
      )}
    </div>
  );
};

export default UnsplashPhotoSearch; 