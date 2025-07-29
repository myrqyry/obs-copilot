/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Core API Keys
    readonly VITE_GIPHY_API_KEY: string
    readonly VITE_TENOR_API_KEY: string
    readonly VITE_ICONFINDER_API_KEY: string
    
    // Image and Photo APIs
    readonly VITE_UNSPLASH_API_KEY: string
    readonly VITE_PEXELS_API_KEY: string
    readonly VITE_PIXABAY_API_KEY: string
    readonly VITE_DEVIANTART_API_KEY: string
    
    // GIF and Media APIs
    readonly VITE_IMGFLIP_API_KEY: string
    readonly VITE_IMGUR_API_KEY: string
    
    // Firebase Configuration
    readonly VITE_FIREBASE_API_KEY: string
    readonly VITE_FIREBASE_AUTH_DOMAIN: string
    readonly VITE_FIREBASE_PROJECT_ID: string
    readonly VITE_FIREBASE_STORAGE_BUCKET: string
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
    readonly VITE_FIREBASE_APP_ID: string
    readonly VITE_FIREBASE_MEASUREMENT_ID: string
    
    // Add more environment variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
