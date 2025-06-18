/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_GIPHY_API_KEY: string
    // Add more environment variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
