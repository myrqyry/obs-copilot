import React from 'react';
import { UnsplashPhoto } from '../services/unsplashService';
interface UnsplashPhotoSearchProps {
    onPhotoSelect?: (photo: UnsplashPhoto) => void;
    className?: string;
}
export declare const UnsplashPhotoSearch: React.FC<UnsplashPhotoSearchProps>;
export default UnsplashPhotoSearch;
