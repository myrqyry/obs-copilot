import { OBSWebSocketService } from '../services/obsService';

export interface AddSourceOptions {
    obsService: OBSWebSocketService;
    currentScene?: string | null;
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
}

/**
 * Add a browser source to OBS
 */
export async function addBrowserSource(
    url: string,
    sourceName: string,
    options: AddSourceOptions
): Promise<void> {
    const { obsService, currentScene, onSuccess, onError } = options;

    try {
        if (!currentScene) {
            throw new Error('No current scene available');
        }

        // Create browser source with standard settings
        await obsService.createInput(
            sourceName,
            'browser_source',
            {
                url: url,
                width: 800,
                height: 600,
                is_local_file: false,
                local_file: '',
                css: '',
                restart_when_active: false,
                shutdown: false,
                fps: 30,
                reroute_audio: false
            },
            currentScene,
            true
        );

        onSuccess?.(`✅ Successfully added browser source "${sourceName}" to scene "${currentScene}"`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError?.(`❌ Failed to add browser source: ${errorMessage}`);
        throw error;
    }
}

/**
 * Add an image source to OBS
 */
export async function addImageSource(
    imageUrl: string,
    sourceName: string,
    options: AddSourceOptions
): Promise<void> {
    const { obsService, currentScene, onSuccess, onError } = options;

    try {
        if (!currentScene) {
            throw new Error('No current scene available');
        }

        // Create image source
        await obsService.createInput(
            sourceName,
            'image_source',
            {
                file: imageUrl,
                is_local_file: false,
                unload: false
            },
            currentScene,
            true
        );

        onSuccess?.(`✅ Successfully added image source "${sourceName}" to scene "${currentScene}"`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError?.(`❌ Failed to add image source: ${errorMessage}`);
        throw error;
    }
}

/**
 * Add a media source to OBS (for GIFs and videos)
 */
export async function addMediaSource(
    mediaUrl: string,
    sourceName: string,
    options: AddSourceOptions
): Promise<void> {
    const { obsService, currentScene, onSuccess, onError } = options;

    try {
        if (!currentScene) {
            throw new Error('No current scene available');
        }

        // Create media source
        await obsService.createInput(
            sourceName,
            'ffmpeg_source',
            {
                input: mediaUrl,
                is_local_file: false,
                looping: true,
                restart_on_activate: false,
                clear_on_media_end: false,
                close_when_inactive: false,
                speed_percent: 100
            },
            currentScene,
            true
        );

        onSuccess?.(`✅ Successfully added media source "${sourceName}" to scene "${currentScene}"`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError?.(`❌ Failed to add media source: ${errorMessage}`);
        throw error;
    }
}

/**
 * Create an SVG as a browser source (since OBS doesn't have native SVG support)
 */
export async function addSvgAsBrowserSource(
    svgContent: string,
    sourceName: string,
    options: AddSourceOptions
): Promise<void> {
    try {
        // Create a data URL with the SVG content
        const svgDataUrl = `data:text/html,<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 20px; background: transparent; display: flex; align-items: center; justify-content: center; }
        svg { max-width: 100%; max-height: 100vh; }
    </style>
</head>
<body>
    ${svgContent}
</body>
</html>`;

        await addBrowserSource(svgDataUrl, sourceName, options);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        options.onError?.(`❌ Failed to add SVG as browser source: ${errorMessage}`);
        throw error;
    }
}

/**
 * Create an emoji as a browser source
 */
export async function addEmojiAsBrowserSource(
    emoji: string,
    sourceName: string,
    options: AddSourceOptions
): Promise<void> {
    try {
        // Create a data URL with the emoji
        const emojiHtml = `data:text/html,<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: transparent; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 120px;
            font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
            height: 100vh;
        }
    </style>
</head>
<body>
    ${emoji}
</body>
</html>`;

        await addBrowserSource(emojiHtml, sourceName, options);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        options.onError?.(`❌ Failed to add emoji as browser source: ${errorMessage}`);
        throw error;
    }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        throw new Error('Failed to copy to clipboard');
    }
}

/**
 * Generate a unique source name based on search query and timestamp
 */
export function generateSourceName(baseName: string, searchQuery?: string): string {
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
    const sanitizedQuery = searchQuery?.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20) || '';
    return `${baseName}${sanitizedQuery ? `-${sanitizedQuery}` : ''}-${timestamp}`;
}
