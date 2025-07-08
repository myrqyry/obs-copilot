import { getProxiedImageUrl } from "../utils/imageProxy";
import { GiphyFetch } from '@giphy/js-fetch-api';
import { getCustomApiKey } from './AdvancedPanel';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GiphyResult } from '../types/giphy';
import { useAppStore } from '../store/appStore';
import { catppuccinAccentColorsHexMap } from '../types';
import { addBrowserSource, addMediaSource, addSvgAsBrowserSource, addEmojiAsBrowserSource, addImageSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import HtmlTemplateBuilder from './HtmlTemplateBuilder';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { FaviconIcon } from './common/FaviconIcon';
import Tooltip from './ui/Tooltip';
import { FaviconDropdown } from './common/FaviconDropdown';
import { CollapsibleCard } from './common/CollapsibleCard';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
import { unsplashService, UnsplashPhoto } from '../services/unsplashService';

// Enhanced API configurations with more parameters
const GIF_APIS = [
    { value: 'giphy', label: 'Giphy', domain: 'giphy.com', icon: '🎬' },
    { value: 'tenor', label: 'Tenor', domain: 'tenor.com', icon: '🎭' },
    { value: 'imgflip', label: 'Imgflip', domain: 'imgflip.com', icon: '🃏' },
    { value: 'reddit', label: 'Reddit GIFs', domain: 'reddit.com', icon: '🤖' },
    { value: 'imgur', label: 'Imgur', domain: 'imgur.com', icon: '📷' }
];

// Enhanced search suggestions for better UX
const SEARCH_SUGGESTIONS = {
    giphy: [
        'reaction', 'meme', 'funny', 'cute', 'dance', 'anime', 'gaming', 'sports',
        'celebration', 'love', 'sad', 'angry', 'surprised', 'confused', 'excited'
    ],
    tenor: [
        'reaction', 'meme', 'funny', 'cute', 'dance', 'anime', 'gaming', 'sports',
        'celebration', 'love', 'sad', 'angry', 'surprised', 'confused', 'excited'
    ],
    imgflip: [
        'meme', 'funny', 'reaction', 'dank', 'viral', 'trending', 'classic', 'modern'
    ],
    reddit: [
        'reaction', 'meme', 'funny', 'gaming', 'anime', 'sports', 'politics', 'technology'
    ],
    imgur: [
        'reaction', 'meme', 'funny', 'gaming', 'anime', 'sports', 'art', 'photography'
    ]
};

// Content rating options
const CONTENT_RATINGS = [
    { value: 'g', label: 'G' },
    { value: 'pg', label: 'PG' },
    { value: 'pg-13', label: 'PG-13' },
    { value: 'r', label: 'R' }
];

// Enhanced search filters
interface SearchFilters {
    rating: string;
    contentFilter: string;
    mediaFilter: string;
    arRange: string;
    random: boolean;
    limit: number;
    contentType: 'gifs' | 'stickers';
}

const getGiphyApiKey = () => {
  const userKey = getCustomApiKey('giphy');
  if (userKey) return userKey;

  if (process.env.NODE_ENV === 'production') {
    return '/.netlify/functions/proxy?api=giphy';
  }

  return import.meta.env.VITE_GIPHY_API_KEY || '';
};
const getTenorApiKey = () => getCustomApiKey('tenor') || import.meta.env.VITE_TENOR_API_KEY || '';
const getImgflipApiKey = () => getCustomApiKey('imgflip') || import.meta.env.VITE_IMGFLIP_API_KEY || '';
const getUnsplashApiKey = () => getCustomApiKey('unsplash') || import.meta.env.VITE_UNSPLASH_API_KEY || '';
const getPexelsApiKey = () => getCustomApiKey('pexels') || import.meta.env.VITE_PEXELS_API_KEY || '';
const getPixabayApiKey = () => getCustomApiKey('pixabay') || import.meta.env.VITE_PIXABAY_API_KEY || '';

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};



const SVG_APIS = [
    { value: 'iconfinder', label: 'Iconfinder', domain: 'iconfinder.com', icon: '🎨' },
    { value: 'iconify', label: 'Iconify', domain: 'iconify.design', icon: '🔧' },
    { value: 'feather', label: 'Feather Icons', domain: 'feathericons.com', icon: '🪶' },
    { value: 'heroicons', label: 'Heroicons', domain: 'heroicons.com', icon: '🦸' },
    { value: 'lucide', label: 'Lucide', domain: 'lucide.dev', icon: '💡' },
    { value: 'tabler', label: 'Tabler Icons', domain: 'tabler-icons.io', icon: '📊' },
    { value: 'bootstrap', label: 'Bootstrap Icons', domain: 'icons.getbootstrap.com', icon: '🚀' },
    { value: 'fontawesome', label: 'Font Awesome', domain: 'fontawesome.com', icon: '⭐' }
];

// Common SVG icons for header display
const COMMON_SVGS = [
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', // star
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>', // check circle
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l.09.98c.6.05 1.19.16 1.77.32l.72-1.71c-.8-.24-1.62-.4-2.46-.48L12 2zm4.64 2.64l-1.37 1.37c.47.33.9.73 1.28 1.17l1.71-.72c-.54-.65-1.15-1.24-1.85-1.82l.23-.0z"/></svg>', // settings
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v3h2v-3zm4 0h-2v3h2v-3zm4 0h-2v3h2v-3zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>', // calendar
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>', // menu
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84C10.19 11.15 10 11.57 10 12C10 12.43 10.19 12.85 10.5 13.16L16.17 18.83L13.5 21.5L15 23L21 17V15H19L17.17 16.83L12.83 12.5L17.17 8.17L19 10H21Z"/></svg>', // brush
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>' // code
];

const getRandomSvg = () => {
    return COMMON_SVGS[Math.floor(Math.random() * COMMON_SVGS.length)];
};

// Common emojis for header display
const COMMON_EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
    '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
];

const getRandomEmoji = () => {
    return COMMON_EMOJIS[Math.floor(Math.random() * COMMON_EMOJIS.length)];
};

const EMOJI_APIS = [
    { value: 'emoji-api', label: 'Emoji API', domain: 'emoji-api.com', icon: '😀' },
    { value: 'emojihub', label: 'EmojiHub', domain: 'emojihub.vercel.app', icon: '🎯' },
    { value: 'emoji-db', label: 'Emoji DB', domain: 'emojidb.com', icon: '🗄️' },
    { value: 'unicode', label: 'Unicode Emoji', domain: 'unicode.org', icon: '🌐' },
    { value: 'openmoji', label: 'OpenMoji', domain: 'openmoji.org', icon: '🎨' },
    { value: 'twemoji', label: 'Twemoji', domain: 'twemoji.twitter.com', icon: '🐦' },
    { value: 'noto', label: 'Noto Emoji', domain: 'fonts.google.com/noto', icon: '📝' }
];

const BACKGROUND_APIS = [
    { value: 'wallhaven', label: 'Wallhaven', domain: 'wallhaven.cc', icon: '🖼️' },
    { value: 'unsplash', label: 'Unsplash', domain: 'unsplash.com', icon: '📸' },
    { value: 'pexels', label: 'Pexels', domain: 'pexels.com', icon: '🎨' },
    { value: 'pixabay', label: 'Pixabay', domain: 'pixabay.com', icon: '🖼️' },
    { value: 'deviantart', label: 'DeviantArt', domain: 'deviantart.com', icon: '🎨' },
    { value: 'artstation', label: 'ArtStation', domain: 'artstation.com', icon: '🎬' }
];

type SvgResult = { name: string; svg: string };
type EmojiResult = { [key: string]: any };


const StreamingAssetsTab = React.memo(() => {
    // Get accent color hex from Zustand
    const accentColorName = useAppStore(state => state.userSettings.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';
    // Memoize the Giphy API key to avoid unnecessary re-initializations
    // Memoize the GiphyFetch instance so it updates when the key changes
    const [openCards, setOpenCards] = useState<{
        html: boolean;
        giphy: boolean;
        svg: boolean;
        emoji: boolean;
        backgrounds: boolean;
        stickers: boolean;
    }>({
        html: false,
        giphy: false,
        svg: false,
        emoji: false,
        backgrounds: false,
        stickers: false,
    });
    // --- Backgrounds Section State ---
    const [backgroundApi, setBackgroundApi] = useState('wallhaven');
    const [backgroundQuery, setBackgroundQuery] = useState('');
    const [backgroundResults, setBackgroundResults] = useState<any[]>([]);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [backgroundPage, setBackgroundPage] = useState(0);
    const [backgroundSearched, setBackgroundSearched] = useState(false);
    const [gifSearched, setGifSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Backgrounds Search Handler ---
    const handleBackgroundSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!backgroundQuery.trim()) return;
        
        setBackgroundLoading(true);
        setBackgroundResults([]);
        setBackgroundSearched(true);
        setSearchError(null);
        setBackgroundPage(0);
        
        try {
            console.log('Background search:', { backgroundApi, backgroundQuery });
            
            if (backgroundApi === 'wallhaven') {
                // Use backend proxy to avoid CORS
                // Use Netlify Function in production, local proxy in dev
                let apiUrl = '';
                const wallhavenKey = getCustomApiKey('wallhaven');
                const keyParam = wallhavenKey ? `&apikey=${encodeURIComponent(wallhavenKey)}` : '';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/wallhaven?q=${encodeURIComponent(backgroundQuery)}&categories=111&purity=100&sorting=relevance&order=desc&page=1${keyParam}`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=wallhaven&q=${encodeURIComponent(backgroundQuery)}&categories=111&purity=100&sorting=relevance&order=desc&page=1${keyParam}`;
                }
                console.log('Wallhaven API URL:', apiUrl);
                const res = await fetch(apiUrl);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Wallhaven API Response Error:', {
                        status: res.status,
                        statusText: res.statusText,
                        url: apiUrl,
                        responseText: errorText.substring(0, 500)
                    });
                    throw new Error(`Wallhaven API error: ${res.status} ${res.statusText}`);
                }
                
                const responseText = await res.text();
                console.log('Wallhaven API Response:', responseText.substring(0, 200));
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', responseText.substring(0, 500));
                    throw new Error('Invalid JSON response from Wallhaven API');
                }
                
                setBackgroundResults(data.data.slice(0, 48));
            } else if (backgroundApi === 'unsplash') {
                const unsplashKey = getUnsplashApiKey();
                if (!unsplashKey) {
                    throw new Error('Unsplash API key required');
                }
                
                // Use the proper unsplashService instead of basic fetch
                const result = await unsplashService.searchPhotos(backgroundQuery, {
                    perPage: 30,
                    orientation: 'landscape',
                    orderBy: 'relevant'
                });
                
                // Transform the results to match the expected format
                setBackgroundResults(result.results.map((item: UnsplashPhoto) => ({
                    id: item.id,
                    title: item.description || item.alt_description || '',
                    url: unsplashService.getPhotoUrl(item, 'regular'),
                    thumbnail: unsplashService.getPhotoUrl(item, 'small'),
                    source: 'unsplash',
                    author: item.user?.name || 'Unknown',
                    attribution: unsplashService.getPhotoAttribution(item),
                    downloadLocation: item.links.download_location,
                    originalPhoto: item // Keep the original photo object for advanced features
                })));
            } else if (backgroundApi === 'pexels') {
                // Use proxy to avoid CORS issues
                let apiUrl = '';
                const pexelsKey = getPexelsApiKey();
                if (!pexelsKey || pexelsKey === 'your_pexels_api_key_here') {
                    throw new Error('Pexels API key required. Get one at https://www.pexels.com/api/ and add it in Advanced Panel → API Keys section.');
                }
                
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/pexels?key=${pexelsKey}&query=${encodeURIComponent(backgroundQuery)}&per_page=30&orientation=landscape`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=pexels&key=${pexelsKey}&query=${encodeURIComponent(backgroundQuery)}&per_page=30&orientation=landscape`;
                }
                console.log('Pexels API URL:', apiUrl);
                const res = await fetch(apiUrl);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('API Response Error:', {
                        status: res.status,
                        statusText: res.statusText,
                        url: apiUrl,
                        responseText: errorText.substring(0, 500) // First 500 chars
                    });
                    throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
                }
                
                const responseText = await res.text();
                console.log('Pexels API Response:', responseText.substring(0, 200)); // First 200 chars
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', responseText.substring(0, 500));
                    throw new Error('Invalid JSON response from Pexels API');
                }
                
                setBackgroundResults(data.photos?.map((item: any) => ({
                    id: item.id,
                    title: item.alt || '',
                    url: item.src.large,
                    thumbnail: item.src.medium,
                    source: 'pexels',
                    author: item.photographer || 'Unknown'
                })) || []);
            } else if (backgroundApi === 'pixabay') {
                const pixabayKey = getPixabayApiKey();
                if (!pixabayKey || pixabayKey === 'your_pixabay_api_key_here') {
                    throw new Error('Pixabay API key required. Get one at https://pixabay.com/api/docs/ and add it in Advanced Panel → API Keys section.');
                }
                
                // Use proxy to avoid CORS issues
                let apiUrl = '';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/pixabay?key=${pixabayKey}&q=${encodeURIComponent(backgroundQuery)}&image_type=photo&orientation=horizontal&per_page=30`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=pixabay&key=${pixabayKey}&q=${encodeURIComponent(backgroundQuery)}&image_type=photo&orientation=horizontal&per_page=30`;
                }
                console.log('Pixabay API URL:', apiUrl);
                const res = await fetch(apiUrl);
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Pixabay API Response Error:', {
                        status: res.status,
                        statusText: res.statusText,
                        url: apiUrl,
                        responseText: errorText.substring(0, 500)
                    });
                    throw new Error(`Pixabay API error: ${res.status} ${res.statusText}`);
                }
                
                const responseText = await res.text();
                console.log('Pixabay API Response:', responseText.substring(0, 200));
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', responseText.substring(0, 500));
                    throw new Error('Invalid JSON response from Pixabay API');
                }
                
                setBackgroundResults(data.hits?.map((item: any) => ({
                    id: item.id,
                    title: item.tags || '',
                    url: item.largeImageURL,
                    thumbnail: item.webformatURL,
                    source: 'pixabay',
                    author: item.user || 'Unknown'
                })) || []);
            } else if (backgroundApi === 'deviantart') {
                // DeviantArt API implementation
                const deviantartKey = getCustomApiKey('deviantart') || import.meta.env.VITE_DEVIANTART_API_KEY || '';
                if (!deviantartKey || deviantartKey === 'your_deviantart_api_key_here') {
                    throw new Error('DeviantArt API key required. Get one at https://www.deviantart.com/developers/ and add it in Advanced Panel → API Keys section.');
                }
                
                // Use proxy to avoid CORS issues
                let apiUrl = '';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/deviantart?key=${deviantartKey}&q=${encodeURIComponent(backgroundQuery)}&limit=30&mature_content=false`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=deviantart&key=${deviantartKey}&q=${encodeURIComponent(backgroundQuery)}&limit=30&mature_content=false`;
                }
                console.log('DeviantArt API URL:', apiUrl);
                const res = await fetch(apiUrl);
                
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('DeviantArt API Response Error:', {
                        status: res.status,
                        statusText: res.statusText,
                        url: apiUrl,
                        responseText: errorText.substring(0, 500)
                    });
                    throw new Error(`DeviantArt API error: ${res.status} ${res.statusText}`);
                }
                
                const responseText = await res.text();
                console.log('DeviantArt API Response:', responseText.substring(0, 200));
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', responseText.substring(0, 500));
                    throw new Error('Invalid JSON response from DeviantArt API');
                }
                
                setBackgroundResults(data.results?.map((item: any) => ({
                    id: item.deviationid,
                    title: item.title || '',
                    url: item.preview?.src || item.thumbs?.[0]?.src || '',
                    thumbnail: item.thumbs?.[0]?.src || '',
                    source: 'deviantart',
                    author: item.author?.username || 'Unknown'
                })) || []);
            } else if (backgroundApi === 'artstation') {
                // ArtStation API implementation - no API key required
                let apiUrl = '';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/artstation?q=${encodeURIComponent(backgroundQuery)}&page=1&per_page=30`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=artstation&q=${encodeURIComponent(backgroundQuery)}&page=1&per_page=30`;
                }
                console.log('ArtStation API URL:', apiUrl);
                const res = await fetch(apiUrl);
                
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('ArtStation API Response Error:', {
                        status: res.status,
                        statusText: res.statusText,
                        url: apiUrl,
                        responseText: errorText.substring(0, 500)
                    });
                    throw new Error(`ArtStation API error: ${res.status} ${res.statusText}`);
                }
                
                const responseText = await res.text();
                console.log('ArtStation API Response:', responseText.substring(0, 200));
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.error('Response was:', responseText.substring(0, 500));
                    throw new Error('Invalid JSON response from ArtStation API');
                }
                
                // Check if ArtStation API returned an error message
                if (data.error && data.message) {
                    throw new Error(data.message);
                }
                
                setBackgroundResults(data.data?.map((item: any) => ({
                    id: item.id,
                    title: item.title || '',
                    url: item.cover?.image_url || '',
                    thumbnail: item.cover?.thumb_url || '',
                    source: 'artstation',
                    author: item.user?.full_name || 'Unknown'
                })) || []);
            }
        } catch (err) {
            console.error('Backgrounds fetch error:', err);
            
            // Add more detailed error logging
            if (err instanceof Error) {
                console.error('Error details:', {
                    message: err.message,
                    backgroundApi,
                    backgroundQuery,
                    stack: err.stack
                });
            }
            
            // Show user-friendly error message
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setSearchError(errorMessage);
        }
        setBackgroundLoading(false);
    }, [backgroundApi, backgroundQuery]);

    // Random SVG for header - generate once per component render
    const [randomHeaderSvg] = useState(() => getRandomSvg());

    // Random emoji for header - generate once per component render
    const [randomHeaderEmoji] = useState(() => getRandomEmoji());

    // --- GIF Section State ---
    const [modalContent, setModalContent] = useState<{ type: 'gif' | 'svg' | 'emoji' | 'background' | 'sticker', data: any } | null>(null);
    const [gifApi, setGifApi] = useState('giphy');
    const [gifQuery, setGifQuery] = useState('');
    const [gifResults, setGifResults] = useState<GiphyResult[]>([]);
    const [gifLoading, setGifLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [gifCategories, setGifCategories] = useState<any[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showGridIcons, setShowGridIcons] = useState(false); // Hidden by default
    const [showBrowseOptions, setShowBrowseOptions] = useState(false); // New: Browse options toggle
    const [sortOrder, setSortOrder] = useState<'relevance' | 'newest' | 'oldest' | 'popular'>('relevance');
    const [gifPage, setGifPage] = useState(0); // New: Pagination state
    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
        rating: 'pg-13',
        contentFilter: 'high',
        mediaFilter: 'minimal',
        arRange: 'all',
        random: false,
        limit: 20,
        contentType: 'gifs'
    });

    const [svgQuery, setSvgQuery] = useState('');
    const [svgApi, setSvgApi] = useState('iconify');
    const [svgResults, setSvgResults] = useState<SvgResult[]>([]);
    const [svgLoading, setSvgLoading] = useState(false);
    const [svgPage, setSvgPage] = useState(0);
    const [svgSearched, setSvgSearched] = useState(false);

    const [emojiQuery, setEmojiQuery] = useState('');
    const [emojiApi, setEmojiApi] = useState('emojihub');
    const [emojiResults, setEmojiResults] = useState<EmojiResult[]>([]);
    const [emojiLoading, setEmojiLoading] = useState(false);
    const [emojiPage, setEmojiPage] = useState(0);
    const [emojiSearched, setEmojiSearched] = useState(false);


    const obsServiceInstance = useAppStore(state => state.obsServiceInstance);
    const currentProgramScene = useAppStore(state => state.currentProgramScene);
    const isConnected = useAppStore(state => state.isConnected);

    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const ITEMS_PER_PAGE = 16; // 4x4 grid

    // Auto-refresh results when switching services
    useEffect(() => {
        // Clear current results when switching services
        setGifResults([]);
        setGifSearched(false);
        setShowCategories(false);
        setGifCategories([]);
        setSelectedCategory(''); // Clear category filter when switching APIs
        setGifPage(0); // Reset pagination when switching APIs
        setSearchError(null); // Clear any previous errors
        setTotalResults(0); // Reset total results count
        setShowBrowseOptions(false); // Hide browse options
        setShowFilters(false); // Hide filters
        setShowSuggestions(false); // Hide suggestions
        
        // Clear the search query when switching to a service that might not support the current query
        if (gifQuery.trim()) {
            setGifQuery(''); // Clear search query for fresh start
        }
        
        // Automatically load categories when switching APIs (but don't auto-search)
        handleShowCategories();
        
        // Show feedback message about service switch
        const serviceName = GIF_APIS.find(api => api.value === gifApi)?.label || gifApi;
        setFeedbackMessage(`Switched to ${serviceName} - ready for new search`);
        setTimeout(() => setFeedbackMessage(null), 3000);
        
    }, [gifApi]);

    // Auto-load categories when user first searches
    useEffect(() => {
        if (gifSearched && gifCategories.length === 0) {
            handleShowCategories();
        }
    }, [gifSearched, gifCategories.length]);

    useEffect(() => {
        // Clear current results when switching services
        setSvgResults([]);
        setSvgPage(0);
        setSvgSearched(false);
    }, [svgApi]);

    useEffect(() => {
        // Clear current results when switching services
        setEmojiResults([]);
        setEmojiPage(0);
        setEmojiSearched(false);
    }, [emojiApi]);

    useEffect(() => {
        // Clear current results when switching services
        setBackgroundResults([]);
        setBackgroundPage(0);
        setBackgroundSearched(false);
    }, [backgroundApi]);

    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

    const toggleCard = (key: keyof typeof openCards) => {
        setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Handle service switching with better UX
    const handleServiceSwitch = (newService: string) => {
        // Show immediate feedback
        setGifLoading(true);
        
        // Update the service
        setGifApi(newService);
        
        // The useEffect will handle the rest of the cleanup and refresh
    };

    // --- GIF Search Handler (Giphy & Tenor) ---
    // (Moved trending/categories handlers just before return below)
    const handleGifSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gifQuery.trim()) return;
        
        setGifLoading(true);
        setGifResults([]);
        setGifSearched(true);
        setSearchError(null);
        setGifPage(0); // Reset to first page for new searches
        
        try {
            // Combine search query with category if selected
            const searchQuery = selectedCategory ? `${gifQuery} ${selectedCategory}` : gifQuery;
            
            if (gifApi === 'giphy') {
                const gfInstance = new GiphyFetch(getGiphyApiKey());
                
                // Determine search type based on stickersOnly filter
                const searchType = searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs';
                
                const response = await gfInstance.search(searchQuery, { 
                    limit: searchFilters.limit, 
                    rating: searchFilters.rating as any,
                    offset: 0, // Start from first page
                    lang: 'en',
                    type: searchType
                });
                
                setGifResults(response.data.map((gif: any) => {
                    const result = {
                        id: gif.id,
                        title: gif.title,
                        images: {
                            fixed_height_small: { url: gif.images.fixed_height_small?.url },
                            original: { url: gif.images.original?.url },
                        },
                        source: 'giphy',
                        url: gif.url,
                        rating: gif.rating,
                        import_datetime: gif.import_datetime,
                        trending_datetime: gif.trending_datetime,
                        user: gif.user,
                        type: searchType
                    };
                    
                    // Debug logging for troubleshooting
                    if (!result.images.fixed_height_small.url && !result.images.original.url) {
                        console.warn('Giphy result missing image URLs:', { gif, result });
                    }
                    
                    return result;
                }));
                setTotalResults(response.pagination.total_count);
                
            } else if (gifApi === 'tenor') {
                const tenorKey = getTenorApiKey();
                const params = new URLSearchParams({
                    key: tenorKey,
                    q: searchQuery,
                    client_key: 'obs-copilot-gemini',
                    contentfilter: searchFilters.contentFilter,
                    media_filter: searchFilters.mediaFilter,
                    ar_range: searchFilters.arRange,
                    locale: 'en_US',
                    country: 'US',
                    limit: searchFilters.limit.toString(),
                    pos: '0' // Start from first page
                });
                
                // Add searchfilter parameter for stickers (Tenor API specific)
                if (searchFilters.contentType === 'stickers') {
                    params.append('searchfilter', 'sticker');
                }
                
                if (searchFilters.random) {
                    params.append('random', 'true');
                }
                
                const res = await fetch(`https://tenor.googleapis.com/v2/search?${params.toString()}`);
                if (!res.ok) {
                    throw new Error(`Tenor API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                
                // Debug: Log the response structure
                console.log('Tenor API response:', data);
                
                // Handle different possible response formats
                const results = data.results || data.data || [];
                
                if (!Array.isArray(results)) {
                    console.error('Tenor API returned unexpected format:', data);
                    throw new Error('Invalid response format from Tenor API');
                }
                
                setGifResults(results.map((item: any) => {
                    // Helper function to get the best transparent URL for stickers
                    const getTransparentUrl = (size: 'small' | 'original') => {
                        if (searchFilters.contentType === 'stickers' && gifApi === 'tenor') {
                            if (size === 'small') {
                                // For grid thumbnails, prefer tinywebp_transparent, then webp_transparent, then tinygif
                                return item.media_formats?.tinywebp_transparent?.url || 
                                       item.media_formats?.webp_transparent?.url || 
                                       item.media_formats?.tinygif?.url || 
                                       item.media_formats?.gif?.url;
                            } else {
                                // For modal previews, prefer webp_transparent, then gif_transparent, then gif
                                return item.media_formats?.webp_transparent?.url || 
                                       item.media_formats?.gif_transparent?.url || 
                                       item.media_formats?.gif?.url || 
                                       item.media_formats?.mp4?.url;
                            }
                        } else {
                            // For regular GIFs, use standard formats
                            return size === 'small' 
                                ? (item.media_formats?.tinygif?.url || item.media_formats?.gif?.url)
                                : (item.media_formats?.gif?.url || item.media_formats?.mp4?.url);
                        }
                    };
                    
                    const result = {
                        id: item.id,
                        title: item.content_description || '',
                        images: {
                            fixed_height_small: { 
                                url: getTransparentUrl('small')
                            },
                            original: { 
                                url: getTransparentUrl('original')
                            }
                        },
                        source: 'tenor',
                        type: searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs',
                        rating: item.content_rating || item.rating,
                    };
                    
                    // Debug logging for troubleshooting
                    if (!result.images.fixed_height_small.url && !result.images.original.url) {
                        console.warn('Tenor result missing image URLs:', { item, result });
                    }
                    
                    return result;
                }));
            } else if (gifApi === 'imgflip') {
                const imgflipKey = getImgflipApiKey();
                const params = new URLSearchParams({
                    q: searchQuery,
                    limit: searchFilters.limit.toString(),
                    page: '1'
                });
                if (imgflipKey) {
                    params.append('api_key', imgflipKey);
                }
                
                // Use proxy to avoid CORS issues
                let apiUrl = '';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/imgflip?${params.toString()}`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=imgflip&${params.toString()}`;
                }
                
                const res = await fetch(apiUrl);
                if (!res.ok) {
                    throw new Error(`Imgflip API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                setGifResults(data.data?.map((item: any) => ({
                    id: item.id,
                    title: item.title || '',
                    images: {
                        fixed_height_small: { url: item.url },
                        original: { url: item.url },
                    },
                    source: 'imgflip',
                    url: item.url,
                    rating: 'g',
                    type: 'gifs'
                })) || []);
                setTotalResults(data.data?.length || 0);
            } else if (gifApi === 'reddit') {
                // Reddit API implementation (using r/gifs subreddit)
                const res = await fetch(`https://www.reddit.com/r/gifs/search.json?q=${encodeURIComponent(searchQuery)}&limit=${searchFilters.limit}&sort=relevance&t=all`);
                if (!res.ok) {
                    throw new Error(`Reddit API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                const results = data.data?.children || [];
                
                setGifResults(results.map((item: any) => ({
                    id: item.data.id,
                    title: item.data.title || '',
                    images: {
                        fixed_height_small: { url: item.data.thumbnail },
                        original: { url: item.data.url }
                    },
                    source: 'reddit',
                    type: 'gifs',
                    rating: 'pg-13'
                })));
                
                setTotalResults(results.length);
            } else if (gifApi === 'imgur') {
                const imgurKey = getCustomApiKey('imgur') || import.meta.env.VITE_IMGUR_API_KEY || '';
                if (!imgurKey) {
                    throw new Error('Imgur API key required. Get one at https://api.imgur.com/oauth2/addclient');
                }
                
                const params = new URLSearchParams({
                    q: searchQuery,
                    q_type: 'gif',
                    sort: 'relevance',
                    window: 'all',
                    page: '1'
                });
                
                // Use proxy to avoid CORS issues
                let apiUrl = '';
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    apiUrl = `/api/imgur?${params.toString()}`;
                } else {
                    apiUrl = `/.netlify/functions/proxy?api=imgur&${params.toString()}`;
                }
                
                const res = await fetch(apiUrl);
                if (!res.ok) {
                    throw new Error(`Imgur API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                
                // Debug logging for troubleshooting
                console.log('Imgur API response:', data);
                
                setGifResults(data.data?.map((item: any) => {
                    const result = {
                        id: item.id,
                        title: item.title || '',
                        images: {
                            fixed_height_small: { url: item.images?.[0]?.link || item.link },
                            original: { url: item.images?.[0]?.link || item.link },
                        },
                        source: 'imgur',
                        url: item.link,
                        rating: 'g',
                        type: 'gifs'
                    };
                    
                    // Debug logging for troubleshooting
                    if (!result.images.fixed_height_small.url && !result.images.original.url) {
                        console.warn('Imgur result missing image URLs:', { item, result });
                    }
                    
                    return result;
                }) || []);
                setTotalResults(data.data?.length || 0);
            }
        } catch (error: any) {
            console.error('GIF search error:', error);
            setSearchError(error.message || 'Failed to search GIFs');
            setGifResults([]);
        } finally {
            setGifLoading(false);
        }
    }, [gifApi, gifQuery, selectedCategory, searchFilters]);

    // --- Giphy Categories/Trending State & Handlers (just before return for JSX scope) ---
    const handleShowTrendingGifs = async () => {
        setGifLoading(true);
        setGifResults([]);
        setGifSearched(true);
        setGifPage(0); // Reset pagination for trending/featured
        try {
            if (gifApi === 'giphy') {
                const gfInstance = new GiphyFetch(getGiphyApiKey());
                const searchType = searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs';
                const response = await gfInstance.trending({ 
                    limit: searchFilters.limit, 
                    rating: searchFilters.rating as any,
                    type: searchType
                });
                setGifResults(response.data.map((gif: any) => ({
                    id: gif.id,
                    title: gif.title,
                    images: {
                        fixed_height_small: { url: gif.images.fixed_height_small?.url },
                        original: { url: gif.images.original?.url },
                    },
                    source: 'giphy',
                    type: searchType,
                    rating: gif.rating,
                    import_datetime: gif.import_datetime,
                    trending_datetime: gif.trending_datetime,
                })));
                setTotalResults(response.pagination.total_count);
            } else if (gifApi === 'tenor') {
                const tenorKey = getTenorApiKey();
                const params = new URLSearchParams({
                    key: tenorKey,
                    limit: String(searchFilters.limit),
                    media_filter: searchFilters.mediaFilter,
                    contentfilter: searchFilters.contentFilter,
                    ar_range: searchFilters.arRange,
                    client_key: 'obs-copilot-gemini',
                    locale: 'en_US',
                    country: 'US',
                });
                // Add searchfilter parameter for stickers (Tenor API specific)
                if (searchFilters.contentType === 'stickers') {
                    params.append('searchfilter', 'sticker');
                }
                if (searchFilters.random) {
                    params.append('random', 'true');
                }
                const url = `https://tenor.googleapis.com/v2/featured?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`Tenor API error: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                setGifResults((data.results || []).map((item: any) => {
                    // Helper function to get the best transparent URL for stickers
                    const getTransparentUrl = (size: 'small' | 'original') => {
                        if (searchFilters.contentType === 'stickers' && gifApi === 'tenor') {
                            if (size === 'small') {
                                // For grid thumbnails, prefer tinywebp_transparent, then webp_transparent, then tinygif
                                return item.media_formats?.tinywebp_transparent?.url || 
                                       item.media_formats?.webp_transparent?.url || 
                                       item.media_formats?.tinygif?.url || 
                                       item.media_formats?.gif?.url;
                            } else {
                                // For modal previews, prefer webp_transparent, then gif_transparent, then gif
                                return item.media_formats?.webp_transparent?.url || 
                                       item.media_formats?.gif_transparent?.url || 
                                       item.media_formats?.gif?.url || 
                                       item.media_formats?.mp4?.url;
                            }
                        } else {
                            // For regular GIFs, use standard formats
                            return size === 'small' 
                                ? (item.media_formats?.tinygif?.url || item.media_formats?.gif?.url)
                                : (item.media_formats?.gif?.url || item.media_formats?.mp4?.url);
                        }
                    };

                    return {
                        id: item.id,
                        title: item.content_description || '',
                        images: {
                            fixed_height_small: { 
                                url: getTransparentUrl('small')
                            },
                            original: { 
                                url: getTransparentUrl('original')
                            }
                        },
                        source: 'tenor',
                        type: searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs',
                        rating: item.content_rating || item.rating,
                    };
                }));
            }
        } catch (err) {
            console.error('Trending GIFs error:', err);
        }
        setGifLoading(false);
    };

    const handleShowCategories = async () => {
        setShowCategories(true);
        setGifLoading(true);
        setGifCategories([]);
        try {
            if (gifApi === 'giphy') {
                const gfInstance = new GiphyFetch(getGiphyApiKey());
                const response = await gfInstance.categories();
                setGifCategories(response.data.map((cat: any) => ({
                    name: cat.name,
                    name_encoded: cat.name_encoded,
                    gif: cat.gif,
                    source: 'giphy',
                })));
            } else if (gifApi === 'tenor') {
                const tenorKey = getTenorApiKey();
                const params = new URLSearchParams({
                    key: tenorKey,
                    client_key: 'obs-copilot-gemini', // Identify our integration
                    locale: 'en_US', // Default locale
                    country: 'US', // Default country
                });
                const url = `https://tenor.googleapis.com/v2/categories?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`Tenor API error: ${res.status} ${res.statusText}`);
                }
                const data = await res.json();
                setGifCategories((data.tags || []).map((tag: any) => ({
                    name: tag.searchterm,
                    name_encoded: tag.searchterm,
                    gif: {
                        images: {
                            fixed_height_small: { url: tag.image },
                        },
                    },
                    source: 'tenor',
                })));
            }
        } catch (err) {
            console.error('Categories error:', err);
        }
        setGifLoading(false);
    };

    const handleCategoryClick = async (cat: any) => {
        setShowCategories(false);
        setSelectedCategory(cat.name);
        setGifLoading(true);
        setGifResults([]);
        setGifSearched(true);
        setGifPage(0); // Reset pagination for category search
        try {
            if (gifApi === 'giphy') {
                const gfInstance = new GiphyFetch(getGiphyApiKey());
                const searchType = searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs';
                const response = await gfInstance.search(cat.name, { 
                    limit: searchFilters.limit, 
                    rating: searchFilters.rating as any,
                    type: searchType
                });
                setGifResults(response.data.map((gif: any) => ({
                    id: gif.id,
                    title: gif.title,
                    images: {
                        fixed_height_small: { url: gif.images.fixed_height_small?.url },
                        original: { url: gif.images.original?.url },
                    },
                    source: 'giphy',
                    type: searchType,
                    rating: gif.rating,
                    import_datetime: gif.import_datetime,
                    trending_datetime: gif.trending_datetime,
                })));
                setTotalResults(response.pagination.total_count);
            } else if (gifApi === 'tenor') {
                const tenorKey = getTenorApiKey();
                const params = new URLSearchParams({
                    q: cat.name,
                    key: tenorKey,
                    limit: String(searchFilters.limit),
                    media_filter: searchFilters.mediaFilter,
                    contentfilter: searchFilters.contentFilter,
                    ar_range: searchFilters.arRange,
                    client_key: 'obs-copilot-gemini',
                    locale: 'en_US',
                    country: 'US',
                });
                
                // Add searchfilter parameter for stickers (Tenor API specific)
                if (searchFilters.contentType === 'stickers') {
                    params.append('searchfilter', 'sticker');
                }
                
                if (searchFilters.random) {
                    params.append('random', 'true');
                }
                
                const url = `https://tenor.googleapis.com/v2/search?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`Tenor API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                
                // Handle different possible response formats
                const results = data.results || data.data || [];
                
                if (!Array.isArray(results)) {
                    console.error('Tenor API returned unexpected format:', data);
                    throw new Error('Invalid response format from Tenor API');
                }
                
                setGifResults(results.map((item: any) => ({
                    id: item.id,
                    title: item.content_description || item.title || '',
                    images: {
                        fixed_height_small: { 
                            url: searchFilters.contentType === 'stickers' 
                                ? (item.media_formats?.tinywebp_transparent?.url || item.media_formats?.webp_transparent?.url || item.media_formats?.tinygif?.url || item.media_formats?.gif?.url)
                                : (item.media_formats?.tinygif?.url || item.media_formats?.gif?.url)
                        },
                        original: { 
                            url: searchFilters.contentType === 'stickers'
                                ? (item.media_formats?.webp_transparent?.url || item.media_formats?.gif_transparent?.url || item.media_formats?.gif?.url)
                                : (item.media_formats?.gif?.url || item.media_formats?.mp4?.url)
                        }
                    },
                    source: 'tenor',
                    type: searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs',
                    rating: item.content_rating || item.rating,
                })));
                setTotalResults(data.next || results.length);
            }
        } catch (err) {
            console.error('Category search error:', err);
        }
        setGifLoading(false);
    };
    const handleSvgSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!svgQuery.trim()) return;
        
        setSvgLoading(true);
        setSvgResults([]);
        setSvgSearched(true);
        setSearchError(null);
        setSvgPage(0);
        
        try {
            const limit = 48;
            if (svgApi === 'iconfinder') {
                // Use local proxy for Iconfinder API
                const params = new URLSearchParams({
                    api: 'iconfinder',
                    query: svgQuery,
                    count: String(limit),
                    premium: '0',
                    vector: '1',
                    license: 'none',
                });
                const url = `/api/proxy?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Iconfinder API error');
                const data = await res.json();
                // Map icons to add svg_url from vector_sizes
                const icons = (data.icons || []).map((icon: any) => {
                    let svg_url = undefined;
                    if (icon.vector_sizes && icon.vector_sizes.length > 0) {
                        const firstVector = icon.vector_sizes[0];
                        if (firstVector.formats && firstVector.formats.length > 0) {
                            const svgFormat = firstVector.formats.find((f: any) => f.format === 'svg');
                            if (svgFormat && svgFormat.download_url) {
                                svg_url = svgFormat.download_url;
                            }
                        }
                    }
                    return { ...icon, svg_url };
                }).filter((icon: any) => icon.is_premium === false && icon.svg_url);
                setSvgResults(icons.slice(0, limit).map((icon: any) => ({
                    name: icon.tags && icon.tags.length > 0 ? icon.tags[0] : icon.icon_id,
                    svg: `<img src="/api/iconfinder/svg?url=${encodeURIComponent(icon.svg_url)}" alt="${icon.tags && icon.tags.length > 0 ? icon.tags[0] : icon.icon_id}" />`
                })));
            } else {
                const apiUrl = `https://api.iconify.design/search?query=${encodeURIComponent(svgQuery)}&limit=${limit}${svgApi !== 'iconify' ? `&prefix=${svgApi}` : ''}`;
                const res = await fetch(apiUrl);
                const data = await res.json();
                if (data.icons && data.icons.length > 0) {
                    const iconNames = data.icons.map((icon: any) => typeof icon === 'string' ? icon : icon.name).slice(0, limit);
                    const svgFetches = iconNames.map(async (iconName: string) => {
                        const fullName = iconName.includes(':') ? iconName : `${svgApi}:${iconName}`;
                        const svgRes = await fetch(`https://api.iconify.design/${fullName}.svg`);
                        return svgRes.ok ? { name: fullName, svg: await svgRes.text() } : null;
                    });
                    setSvgResults((await Promise.all(svgFetches)).filter(r => r) as SvgResult[]);
                }
            }
        } catch (err) {
            console.error('SVG fetch error:', err);
        }
        setSvgLoading(false);
    }, [svgApi, svgQuery]);

    const handleEmojiSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emojiQuery.trim()) return;
        
        setEmojiLoading(true);
        setEmojiResults([]);
        setEmojiSearched(true);
        setSearchError(null);
        setEmojiPage(0);
        
        try {
            let results: EmojiResult[] = [];
            const query = emojiQuery.toLowerCase();
            if (emojiApi === 'emojihub') {
                const res = await fetch('https://emojihub.yurace.pro/api/all');
                if (res.ok) {
                    results = (await res.json()).filter((emoji: any) =>
                        emoji.name.toLowerCase().includes(query) ||
                        emoji.category.toLowerCase().includes(query) ||
                        emoji.group.toLowerCase().includes(query)
                    );
                }
            } else if (emojiApi === 'openemoji') {
                const apiKey = '99e3ed8c1216ba115deec7b4d46dd5bca5ef1a6b';
                const res = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(query)}&access_key=${apiKey}`);
                if (res.ok) results = await res.json();
            }
            setEmojiResults(results.slice(0, 48));
        } catch (err) {
            console.error('Emoji fetch error:', err);
        }
        setEmojiLoading(false);
    }, [emojiApi, emojiQuery]);

    const showFeedback = (message: string) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleAddAsBrowserSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) return showFeedback('OBS not connected.');
        try {
            await addBrowserSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
            showFeedback(`Added ${sourceName} to OBS.`);
        } catch (error) {
            showFeedback('Failed to add source.');
        }
    };

    const handleAddAsImageSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) return showFeedback('OBS not connected.');
        try {
            await addImageSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
            showFeedback(`Added ${sourceName} to OBS.`);
        } catch (error) {
            showFeedback('Failed to add source.');
        }
    };

    const handleAddAsMediaSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) return showFeedback('OBS not connected.');
        try {
            await addMediaSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
            showFeedback(`Added ${sourceName} to OBS.`);
        } catch (error) {
            showFeedback('Failed to add source.');
        }
    };

    const handleAddSvgAsBrowserSource = async (svg: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) return showFeedback('OBS not connected.');
        try {
            await addSvgAsBrowserSource(obsServiceInstance, currentProgramScene, svg, generateSourceName(sourceName));
            showFeedback(`Added ${sourceName} to OBS.`);
        } catch (error) {
            showFeedback('Failed to add source.');
        }
    };

    const handleAddEmojiAsBrowserSource = async (emoji: any, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) return showFeedback('OBS not connected.');
        try {
            const emojiChar = getEmojiChar(emoji);
            await addEmojiAsBrowserSource(obsServiceInstance, currentProgramScene, emojiChar, generateSourceName(sourceName));
            showFeedback(`Added ${sourceName} to OBS.`);
        } catch (error) {
            showFeedback('Failed to add source.');
        }
    };

    const getEmojiChar = (emojiData: any): string => {
        if (!emojiData) return '❓';
        if (typeof emojiData === 'string') return emojiData;
        if (emojiData.character) return emojiData.character;
        if (emojiData.emoji) return emojiData.emoji;
        if (emojiData.htmlCode && Array.isArray(emojiData.htmlCode)) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = emojiData.htmlCode[0];
            return tempDiv.textContent || '❓';
        }
        return '❓';
    };

    const getModalActions = (type: 'gif' | 'svg' | 'emoji' | 'background' | 'sticker', data: any): ModalAction[] => {
        switch (type) {
            case 'sticker':
                return [
                    { label: 'Add as Image Source', onClick: () => handleAddAsImageSource(data.images?.original?.url || data.png_url, data.name || 'sticker'), variant: 'primary' },
                    { label: 'Copy Image URL', onClick: () => { copyToClipboard(data.images?.original?.url || data.png_url); showFeedback('Copied image URL!'); } },
                ];
            case 'gif':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.images.original.url, data.title || data.source || 'gif'), variant: 'primary' },
                    { label: 'Add as Media Source', onClick: () => handleAddAsMediaSource(data.images.original.url, data.title || data.source || 'gif'), variant: 'secondary' },
                    { label: 'Copy URL', onClick: () => { copyToClipboard(data.images.original.url); showFeedback('Copied GIF URL!'); } },
                ];
            case 'svg':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddSvgAsBrowserSource(data.svg, data.name), variant: 'primary' },
                    { label: 'Copy SVG Code', onClick: () => { copyToClipboard(data.svg); showFeedback('Copied SVG code!'); } },
                ];
            case 'emoji':
                const emojiChar = getEmojiChar(data);
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddEmojiAsBrowserSource(emojiChar, data.name || 'emoji'), variant: 'primary' },
                    { label: 'Copy Emoji', onClick: () => { copyToClipboard(emojiChar); showFeedback('Copied Emoji!'); } },
                ];
            case 'background':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.path, data.id || 'background'), variant: 'primary' },
                    { label: 'Copy Image URL', onClick: () => { copyToClipboard(data.path); showFeedback('Copied image URL!'); } },
                ];
            default:
                return [];
        }
    };

    const renderBackgroundModal = (data: any) => {
        const imageUrl = getProxiedImageUrl(data.preview || data.full);
        if (imageUrl) {
            return <img src={imageUrl} alt={data.id} className="max-w-full max-h-[70vh] mx-auto" />;
        } else {
            return (
                <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto">
                    <p className="text-muted-foreground">Image not available</p>
                </div>
            );
        }
    };

    const renderCollapsibleCard = (
        cardKey: keyof typeof openCards,
        title: string,
        emoji: string,
        content: React.ReactNode,
        domain?: string,
        customSvg?: string
    ) => (
        <Card
            className={
                `glass-card shadow rounded-lg transition-all duration-200 p-0 ${openCards[cardKey] ? 'ring-2 ring-accent/40 scale-[1.01]' : 'hover:scale-[1.01] hover:shadow-md'}`
            }
        >
            <button
                className="w-full flex items-center gap-2 px-2 py-0 min-h-0 bg-transparent rounded-t-lg focus:outline-none group"
                onClick={() => toggleCard(cardKey)}
                aria-expanded={openCards[cardKey]}
            >
                {domain && (
                    <Tooltip content={domain}>
                        <span className="flex items-center gap-1">
                            <FaviconIcon domain={domain} size={24} />
                        </span>
                    </Tooltip>
                )}
                {customSvg && <span className="w-6 h-6" style={{ color: accentColor }} dangerouslySetInnerHTML={{ __html: customSvg }} />}
                {emoji && <span className="text-2xl select-none" style={{ color: accentColor }}>{emoji}</span>}
                <span className="text-lg font-semibold flex-1 text-left truncate" style={{ color: accentColor }}>
                    {title}
                </span>
                <svg className={`w-5 h-5 ml-1 transition-transform duration-200 ${openCards[cardKey] ? 'rotate-180' : ''}`} style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {openCards[cardKey] && (
                <CardContent className="px-1 pb-1 pt-0 animate-fade-in">
                    {content}
                </CardContent>
            )}
        </Card>
    );

    // Enhanced search helpers
    const getSearchSuggestions = () => {
        return SEARCH_SUGGESTIONS[gifApi as keyof typeof SEARCH_SUGGESTIONS] || [];
    };

    const handleSuggestionClick = (suggestion: string) => {
        setGifQuery(suggestion);
        setShowSuggestions(false);
        // Auto-search when suggestion is clicked
        setTimeout(() => {
            // Find the form by looking for the submit button's parent form
            const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton && submitButton.form) {
                submitButton.form.requestSubmit();
            }
        }, 100);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setSearchFilters(prev => ({ ...prev, [key]: value }));
        
        // Auto-search when filters change if there's an active search
        if (gifSearched && gifQuery.trim()) {
            setTimeout(() => {
                const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                handleGifSearch(searchEvent);
            }, 100);
        }
    };

    // Handle sort order changes
    const handleSortOrderChange = (newSortOrder: 'relevance' | 'newest' | 'oldest' | 'popular') => {
        setSortOrder(newSortOrder);
        
        // Auto-search when sort order changes if there's an active search
        if (gifSearched && gifQuery.trim()) {
            setTimeout(() => {
                const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                handleGifSearch(searchEvent);
            }, 100);
        }
    };

    // Filter and sort results based on selected options
    const getFilteredAndSortedResults = () => {
        let filtered = [...gifResults];
        
        // Filter by category if selected
        if (selectedCategory && gifApi === 'giphy') {
            // For Giphy, we'd need to implement category filtering
            // This is a placeholder for future implementation
        }
        
        // Sort results
        switch (sortOrder) {
            case 'newest':
                filtered.sort((a, b) => {
                    const dateA = new Date(a.import_datetime || a.created || 0);
                    const dateB = new Date(b.import_datetime || b.created || 0);
                    return dateB.getTime() - dateA.getTime();
                });
                break;
            case 'oldest':
                filtered.sort((a, b) => {
                    const dateA = new Date(a.import_datetime || a.created || 0);
                    const dateB = new Date(b.import_datetime || b.created || 0);
                    return dateA.getTime() - dateB.getTime();
                });
                break;
            case 'popular':
                // Sort by trending datetime if available
                filtered.sort((a, b) => {
                    const trendA = a.trending_datetime ? new Date(a.trending_datetime).getTime() : 0;
                    const trendB = b.trending_datetime ? new Date(b.trending_datetime).getTime() : 0;
                    return trendB - trendA;
                });
                break;
            default: // relevance - keep original order
                break;
        }
        
        return filtered;
    };

    // --- GIF Pagination Handler ---
    const handleGifPageChange = async (newPage: number) => {
        if (!gifQuery.trim() || gifLoading) return;
        
        setGifLoading(true);
        setGifPage(newPage);
        setSearchError(null);
        
        try {
            // Combine search query with category if selected
            const searchQuery = selectedCategory ? `${gifQuery} ${selectedCategory}` : gifQuery;
            
            if (gifApi === 'giphy') {
                const gfInstance = new GiphyFetch(getGiphyApiKey());
                const searchType = searchFilters.contentType === 'stickers' ? 'stickers' : 'gifs';
                
                const response = await gfInstance.search(searchQuery, { 
                    limit: searchFilters.limit, 
                    rating: searchFilters.rating as any,
                    offset: newPage * searchFilters.limit, // Calculate offset for page
                    lang: 'en',
                    type: searchType
                });
                
                setGifResults(response.data.map((gif: any) => {
                    const result = {
                        id: gif.id,
                        title: gif.title,
                        images: {
                            fixed_height_small: { url: gif.images.fixed_height_small?.url },
                            original: { url: gif.images.original?.url },
                        },
                        source: 'giphy',
                        url: gif.url,
                        rating: gif.rating,
                        import_datetime: gif.import_datetime,
                        trending_datetime: gif.trending_datetime,
                        user: gif.user,
                        type: searchType
                    };
                    
                    // Debug logging for troubleshooting
                    if (!result.images.fixed_height_small.url && !result.images.original.url) {
                        console.warn('Giphy result missing image URLs:', { gif, result });
                    }
                    
                    return result;
                }));
                setTotalResults(response.pagination.total_count);
            } else if (gifApi === 'tenor') {
                const tenorKey = getTenorApiKey();
                const params = new URLSearchParams({
                    key: tenorKey,
                    q: searchQuery,
                    client_key: 'obs-copilot-gemini',
                    contentfilter: searchFilters.contentFilter,
                    media_filter: searchFilters.mediaFilter,
                    ar_range: searchFilters.arRange,
                    locale: 'en_US',
                    country: 'US',
                    limit: searchFilters.limit.toString(),
                    pos: (newPage * searchFilters.limit).toString() // Calculate position for page
                });
                
                if (searchFilters.contentType === 'stickers') {
                    params.append('searchfilter', 'sticker');
                }
                
                if (searchFilters.random) {
                    params.append('random', 'true');
                }
                
                const res = await fetch(`https://tenor.googleapis.com/v2/search?${params.toString()}`);
                if (!res.ok) {
                    throw new Error(`Tenor API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                setGifResults(data.results.map((gif: any) => {
                    // Helper function to get the best transparent URL for stickers
                    const getTransparentUrl = (size: 'small' | 'original') => {
                        if (searchFilters.contentType === 'stickers' && gifApi === 'tenor') {
                            if (size === 'small') {
                                // For grid thumbnails, prefer tinywebp_transparent, then webp_transparent, then tinygif
                                return gif.media_formats?.tinywebp_transparent?.url || 
                                       gif.media_formats?.webp_transparent?.url || 
                                       gif.media_formats?.tinygif?.url || 
                                       gif.media_formats?.gif?.url;
                            } else {
                                // For modal previews, prefer webp_transparent, then gif_transparent, then gif
                                return gif.media_formats?.webp_transparent?.url || 
                                       gif.media_formats?.gif_transparent?.url || 
                                       gif.media_formats?.gif?.url || 
                                       gif.media_formats?.mp4?.url;
                            }
                        } else {
                            // For regular GIFs, use standard formats
                            return size === 'small' 
                                ? (gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url)
                                : (gif.media_formats?.gif?.url || gif.media_formats?.mp4?.url);
                        }
                    };
                    
                    return {
                        id: gif.id,
                        title: gif.title || gif.content_description,
                        images: {
                            fixed_height_small: { 
                                url: getTransparentUrl('small')
                            },
                            original: { 
                                url: getTransparentUrl('original')
                            }
                        },
                        type: searchFilters.contentType,
                        source: 'tenor'
                    };
                }));
                setTotalResults(data.next || 0);
            }
        } catch (error: any) {
            console.error('GIF pagination error:', error);
            setSearchError(error.message || 'Failed to load page');
        } finally {
            setGifLoading(false);
        }
    };

    // Memoized grid item component for better performance
    const GridItem = useMemo(() => React.memo(({ item, type, onClick }: { 
        item: any; 
        type: 'gif' | 'svg' | 'emoji' | 'background'; 
        onClick: () => void;
    }) => {
        // Get the best available image URL for grid preview
        const getGridImageUrl = () => {
            if (item.images?.fixed_height_small?.url) {
                return item.images.fixed_height_small.url;
            }
            if (item.images?.original?.url) {
                return item.images.original.url;
            }
            // Fallback for different URL structures
            if (item.url) {
                return item.url;
            }
            if (item.path) {
                return item.path;
            }
            return '';
        };

        const imageUrl = getGridImageUrl();

        // Debug logging for troubleshooting
        if (!imageUrl && (type === 'gif' || item.type === 'gifs' || item.type === 'stickers')) {
            console.warn('No image URL found for grid item:', { item, type });
        }

        const isSticker = item.type === 'stickers';

        return (
            <div
                className={`min-h-[128px] flex flex-col cursor-pointer rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg border border-border ${isSticker ? 'bg-transparent' : 'bg-card'}`}
                data-type={item.type || type}
                onClick={onClick}
            >
                {(type === 'gif' || item.type === 'gifs' || item.type === 'stickers') && imageUrl && (
                    <img
                        src={imageUrl}
                        alt={item.title || 'GIF'}
                        className={`w-full h-[128px] ${isSticker ? 'object-contain bg-transparent' : 'object-cover'}`}
                        loading="lazy"
                        onError={(e) => {
                            console.warn('Image failed to load:', imageUrl, 'Falling back to original URL');
                            // Fallback to original URL if small image fails
                            const target = e.target as HTMLImageElement;
                            if (target.src !== item.images?.original?.url && item.images?.original?.url) {
                                target.src = item.images.original.url;
                            } else if (target.src !== item.url && item.url) {
                                target.src = item.url;
                            } else {
                                // Hide broken image
                                target.style.display = 'none';
                            }
                        }}
                        style={isSticker ? { mixBlendMode: 'normal', backgroundColor: 'transparent' } : {}}
                    />
                )}
                {(type === 'gif' || item.type === 'gifs' || item.type === 'stickers') && !imageUrl && (
                    <div className="w-full h-[128px] flex items-center justify-center bg-muted text-muted-foreground text-xs">
                        No preview available
                    </div>
                )}
                {type === 'svg' && (
                    <div className="w-full h-[128px] p-4 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                        <div className="w-full h-full object-contain" dangerouslySetInnerHTML={{ __html: item.svg }} />
                    </div>
                )}
                {type === 'emoji' && (
                    <div className="flex items-center justify-center w-full h-[128px] text-4xl">
                        {getEmojiChar(item)}
                    </div>
                )}
                {type === 'background' && (
                    <img
                        src={item.path || item.url}
                        alt={item.id || 'Background'}
                        className="w-full h-[128px] object-cover"
                        loading="lazy"
                    />
                )}
            </div>
        );
    }), []);

    return (
        <div className="space-y-2 max-w-4xl mx-auto p-0">
            {feedbackMessage && <div className="fixed bottom-4 right-4 bg-success text-success-foreground p-2 rounded-lg shadow-lg z-50 text-sm">{feedbackMessage}</div>}

            {renderCollapsibleCard('html', 'HTML Templates', '📄', (
                <HtmlTemplateBuilder accentColorName={accentColorName} />
            ))}

            {renderCollapsibleCard('giphy', 'GIF Search', '', (
                <div className={`${gifLoading && !gifResults.length ? 'animate-serviceSwitch' : ''}`}> {/* Apply animation conditionally based on loading state and results presence */}
                    {/* API Key Information for Imgur */}
                    {gifApi === 'imgur' && (
                        <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-500">🔑</span>
                                <div>
                                    <p className="text-blue-500 font-medium mb-1">
                                        Imgur Client ID Required
                                    </p>
                                    <p className="text-muted-foreground mb-1">
                                        Get your free Client ID at https://api.imgur.com/oauth2/addclient
                                    </p>
                                    <p className="text-muted-foreground">
                                        Add your Client ID in the Advanced Panel → API Keys section
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handleGifSearch} className="space-y-1">
                        {/* Search Input and Service Selection */}
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={gifQuery}
                                onChange={(e) => setGifQuery(e.target.value)}
                                placeholder="Search for GIFs..."
                                className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            <div className="relative">
                                <FaviconDropdown
                                    options={GIF_APIS}
                                    value={gifApi}
                                    onChange={handleServiceSwitch}
                                    className={`min-w-[100px] ${gifLoading ? 'service-dropdown-loading' : ''}`}
                                    accentColor={accentColor}
                                />
                                {/* Service switching indicator */}
                                {gifLoading && (
                                    <div className="absolute inset-0 bg-background/80 rounded flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent"></div>
                                    </div>
                                )}
                            </div>
                            <Button type="submit" disabled={gifLoading || !gifQuery.trim()} size="sm">
                                {gifLoading ? 'Searching...' : 'Search'}
                            </Button>
                        </div>

                        {/* Quick Filter Options */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Basic Search Options */}
                            <div className="flex items-center gap-1">
                                <label className="flex items-center space-x-1 text-xs text-muted-foreground cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={searchFilters.contentType === 'gifs'}
                                        onChange={() => handleFilterChange('contentType', 'gifs')}
                                        className="appearance-none h-3 w-3 border-2 border-border rounded-sm bg-background
                                                   checked:bg-primary checked:border-transparent focus:outline-none 
                                                   focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                                                   transition duration-150 group-hover:border-border"
                                    />
                                    <span className="group-hover:text-foreground transition-colors duration-200 text-xs">
                                        GIFs
                                    </span>
                                </label>
                                <label className="flex items-center space-x-1 text-xs text-muted-foreground cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={searchFilters.contentType === 'stickers'}
                                        onChange={() => handleFilterChange('contentType', 'stickers')}
                                        className="appearance-none h-3 w-3 border-2 border-border rounded-sm bg-background
                                                   checked:bg-primary checked:border-transparent focus:outline-none 
                                                   focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                                                   transition duration-150 group-hover:border-border"
                                    />
                                    <span className="group-hover:text-foreground transition-colors duration-200 text-xs">
                                        Stickers
                                    </span>
                                </label>
                            </div>

                            {/* Category Filter - Only show for GIFs */}
                            {searchFilters.contentType === 'gifs' && (
                                <div className="flex items-center gap-1">
                                    <label className="text-xs text-muted-foreground">Category:</label>
                                    <div className="relative flex items-center">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => {
                                                const category = e.target.value;
                                                setSelectedCategory(category);
                                                if (category && gifQuery.trim()) {
                                                    // Auto-search when category is selected
                                                    const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                                                    handleGifSearch(searchEvent);
                                                }
                                            }}
                                            className={`text-xs bg-background border rounded px-1 py-0.5 min-w-[120px] pr-6 ${
                                                selectedCategory ? 'border-primary' : 'border-border'
                                            }`}
                                        >
                                            <option value="">All Categories</option>
                                            {gifCategories.length > 0 ? (
                                                gifCategories.map(cat => (
                                                    <option key={cat.name} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Loading categories...</option>
                                            )}
                                        </select>
                                        {selectedCategory && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCategory('');
                                                    if (gifQuery.trim()) {
                                                        // Auto-search when category is cleared
                                                        const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                                                        handleGifSearch(searchEvent);
                                                    }
                                                }}
                                                className="absolute right-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                                                title="Clear category filter"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Browse Options Button */}
                            <div className="relative">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => setShowBrowseOptions(!showBrowseOptions)}
                                    className="text-xs px-2 py-0.5 h-6"
                                >
                                    {showBrowseOptions ? 'Hide' : 'Browse'}
                                </Button>
                                
                                {/* Browse Options Dropdown */}
                                {showBrowseOptions && (
                                    <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded shadow-lg z-10 min-w-[120px]">
                                        <div className="p-1 space-y-1">
                                            <button
                                                onClick={() => {
                                                    handleShowTrendingGifs();
                                                    setShowBrowseOptions(false);
                                                }}
                                                className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded transition-colors"
                                            >
                                                {gifApi === 'tenor' ? 'Featured' : 'Trending'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleShowCategories();
                                                    setShowBrowseOptions(false);
                                                }}
                                                className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded transition-colors"
                                            >
                                                Categories
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Advanced Filters Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-primary hover:text-primary/80 transition-colors text-xs"
                            >
                                {showFilters ? 'Hide' : 'Show'} Advanced Filters
                            </button>

                            {/* Grid Icons Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowGridIcons(!showGridIcons)}
                                className="text-primary hover:text-primary/80 transition-colors text-xs"
                            >
                                {showGridIcons ? 'Hide' : 'Show'} Grid Icons
                            </button>
                        </div>

                        {/* Advanced Filters (Hidden by default) */}
                        {showFilters && (
                            <div className="p-2 bg-card border border-border rounded text-xs space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Content Rating */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Content Rating</label>
                                        <select
                                            value={searchFilters.rating}
                                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                                            className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                                        >
                                            {CONTENT_RATINGS.map(rating => (
                                                <option key={rating.value} value={rating.value}>
                                                    {rating.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sort Order */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Sort By</label>
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => handleSortOrderChange(e.target.value as any)}
                                            className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="newest">Newest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="popular">Popular</option>
                                        </select>
                                    </div>

                                    {/* Content Filter (for Tenor) */}
                                    {gifApi === 'tenor' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Content Filter</label>
                                            <select
                                                value={searchFilters.contentFilter}
                                                onChange={(e) => handleFilterChange('contentFilter', e.target.value)}
                                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                                            >
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                                <option value="off">Off</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Media Filter (for Tenor) */}
                                    {gifApi === 'tenor' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Media Filter</label>
                                            <select
                                                value={searchFilters.mediaFilter}
                                                onChange={(e) => handleFilterChange('mediaFilter', e.target.value)}
                                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                                            >
                                                <option value="minimal">Minimal</option>
                                                <option value="basic">Basic</option>
                                                <option value="off">Off</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Aspect Ratio (for Tenor) */}
                                    {gifApi === 'tenor' && (
                                        <div>
                                            <label className="text-xs text-muted-foreground">Aspect Ratio</label>
                                            <select
                                                value={searchFilters.arRange}
                                                onChange={(e) => handleFilterChange('arRange', e.target.value)}
                                                className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                                            >
                                                <option value="all">All</option>
                                                <option value="wide">Wide</option>
                                                <option value="standard">Standard</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Random Results */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Random Order</label>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={searchFilters.random}
                                                onChange={(e) => handleFilterChange('random', e.target.checked)}
                                                className="h-3 w-3 border border-border rounded bg-background checked:bg-primary"
                                            />
                                            <span className="text-xs ml-1">Randomize</span>
                                        </div>
                                    </div>

                                    {/* Results Limit */}
                                    <div>
                                        <label className="text-xs text-muted-foreground">Results Limit</label>
                                        <select
                                            value={searchFilters.limit}
                                            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                            className="w-full text-xs bg-background border border-border rounded px-1 py-0.5"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={30}>30</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Suggestions */}
                        {showSuggestions && (
                            <div className="p-1 bg-card border border-border rounded">
                                <div className="text-xs text-muted-foreground mb-1">Suggestions:</div>
                                <div className="flex flex-wrap gap-1">
                                    {getSearchSuggestions().slice(0, 8).map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="text-xs bg-muted hover:bg-muted/80 px-1 py-0.5 rounded transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {searchError && (
                            <div className="p-1 bg-destructive/10 border border-destructive/30 rounded">
                                <p className="text-destructive text-xs">{searchError}</p>
                            </div>
                        )}

                        {/* Browse Options Panel - Show categories when browsing */}
                        {showBrowseOptions && showCategories && (
                            <div className="p-2 bg-card border border-border rounded text-xs space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {gifCategories.map(cat => (
                                        <Button key={cat.name} size="sm" variant="secondary" onClick={() => handleCategoryClick(cat)}>
                                            {cat.gif && <img src={cat.gif.images.fixed_height_small.url} alt={cat.name} className="inline-block w-4 h-4 rounded mr-0.5 align-middle" />} {cat.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                    
                    {/* Enhanced Results Display */}
                    {gifSearched && (
                        <div className="mt-1">
                            {/* Service Switching Indicator */}
                            {gifLoading && gifResults.length === 0 && (
                                <div className="mb-2 p-2 bg-accent/10 border border-accent/30 rounded text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                                        <span className="text-accent font-medium">
                                            Switching to {GIF_APIS.find(api => api.value === gifApi)?.label || gifApi}...
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Category Filter Indicator */}
                            {selectedCategory && (
                                <div className="mb-2 p-1 bg-primary/10 border border-primary/30 rounded text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-primary font-medium">
                                            🔍 Filtered by category: <span className="font-bold">{selectedCategory}</span>
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedCategory('');
                                                if (gifQuery.trim()) {
                                                    const searchEvent = { preventDefault: () => {} } as React.FormEvent;
                                                    handleGifSearch(searchEvent);
                                                }
                                            }}
                                            className="text-primary hover:text-destructive transition-colors"
                                            title="Clear category filter"
                                        >
                                            Clear filter
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {gifLoading && gifResults.length === 0 ? (
                                <div className="flex justify-center items-center py-4">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
                                        <p className="text-xs text-muted-foreground">Searching for {searchFilters.contentType === 'stickers' ? 'stickers' : 'GIFs'}...</p>
                                    </div>
                                </div>
                            ) : gifResults.length > 0 ? (
                                <div>
                                    {/* Results Summary */}
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-muted-foreground">
                                            Found {totalResults.toLocaleString()} results
                                        </span>
                                        <span className="text-muted-foreground">
                                            Powered by {GIF_APIS.find(api => api.value === gifApi)?.label || gifApi}
                                        </span>
                                    </div>

                                    {/* Pagination Controls - Top */}
                                    {totalResults > searchFilters.limit && (
                                        <div className="flex justify-center items-center space-x-1 mb-2">
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={() => handleGifPageChange(gifPage - 1)} 
                                                disabled={gifPage === 0 || gifLoading}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-xs text-muted-foreground">
                                                Page {gifPage + 1} of {Math.ceil(totalResults / searchFilters.limit)}
                                            </span>
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={() => handleGifPageChange(gifPage + 1)} 
                                                disabled={gifPage >= Math.ceil(totalResults / searchFilters.limit) - 1 || gifLoading}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {/* Results Grid */}
                                    <div className="grid grid-cols-4 gap-1">
                                        {getFilteredAndSortedResults().map((gif) => (
                                            <GridItem
                                                key={gif.id}
                                                item={gif}
                                                type="gif"
                                                onClick={() => {
                                                    setModalContent({ type: 'gif', data: gif });
                                                }}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Results Summary */}
                                    <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                                        <span>
                                            Showing {gifResults.length} of {typeof totalResults === 'number' && !isNaN(totalResults) ? totalResults.toLocaleString() : gifResults.length} {searchFilters.contentType === 'stickers' ? 'stickers' : 'results'}
                                        </span>
                                        <span>Powered by {GIF_APIS.find(api => api.value === gifApi)?.label || gifApi}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-xs text-muted-foreground">No {searchFilters.contentType === 'stickers' ? 'stickers' : 'GIFs'} found. Try a different search term.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ), GIF_APIS.find(a => a.value === gifApi)?.domain)}

            {renderCollapsibleCard('svg', 'SVG Icons', '', (
                <div>
                    <form onSubmit={handleSvgSearch} className="flex items-center gap-1 mb-0.5">
                        <input
                            type="text"
                            value={svgQuery}
                            onChange={(e) => setSvgQuery(e.target.value)}
                            placeholder="Search for SVG icons..."
                            className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <FaviconDropdown
                            options={SVG_APIS}
                            value={svgApi}
                            onChange={setSvgApi}
                            className="min-w-[100px]"
                            accentColor={accentColor}
                        />
                        <Button type="submit" disabled={svgLoading || !svgQuery.trim()} size="sm">{svgLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {svgLoading && <div className="text-center text-xs">Loading...</div>}
                    {!svgLoading && svgSearched && svgResults.length === 0 && <div className="text-center text-muted-foreground text-xs">No results found.</div>}
                    <div className="grid grid-cols-4 gap-1">
                        {getPaginatedItems(svgResults, svgPage).map((result) => (
                            <div key={result.name} className="relative group cursor-pointer p-1 bg-slate-800 rounded-md flex items-center justify-center aspect-square" onClick={() => setModalContent({ type: 'svg', data: result })}>
                                <div className="w-full h-full svg-container" dangerouslySetInnerHTML={{ __html: result.svg }} />
                            </div>
                        ))}
                    </div>
                    {getTotalPages(svgResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setSvgPage(svgPage - 1)} disabled={svgPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {svgPage + 1} of {getTotalPages(svgResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setSvgPage(svgPage + 1)} disabled={svgPage >= getTotalPages(svgResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ), undefined, randomHeaderSvg)}

            {renderCollapsibleCard('emoji', 'Emojis', randomHeaderEmoji, (
                <div>
                    <form onSubmit={handleEmojiSearch} className="flex items-center gap-1 mb-0.5">
                        <input
                            type="text"
                            value={emojiQuery}
                            onChange={(e) => setEmojiQuery(e.target.value)}
                            placeholder="Search for emojis..."
                            className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <FaviconDropdown
                            options={EMOJI_APIS}
                            value={emojiApi}
                            onChange={setEmojiApi}
                            className="min-w-[100px]"
                            accentColor={accentColor}
                        />
                        <Button type="submit" disabled={emojiLoading || !emojiQuery.trim()} size="sm">{emojiLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {emojiLoading && <div className="text-center text-xs">Loading...</div>}
                    {!emojiLoading && emojiSearched && emojiResults.length === 0 && <div className="text-center text-muted-foreground text-xs">No results found.</div>}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                        {getPaginatedItems(emojiResults, emojiPage).map((emoji, index) => (
                            <div key={`${emoji.slug}-${index}`} className="relative group cursor-pointer p-1 bg-slate-800 rounded-md flex items-center justify-center aspect-square text-2xl sm:text-3xl md:text-4xl" onClick={() => setModalContent({ type: 'emoji', data: emoji })}>
                                {getEmojiChar(emoji)}
                            </div>
                        ))}
                    </div>
                    {getTotalPages(emojiResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setEmojiPage(emojiPage - 1)} disabled={emojiPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {emojiPage + 1} of {getTotalPages(emojiResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setEmojiPage(emojiPage + 1)} disabled={emojiPage >= getTotalPages(emojiResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ))}

            {renderCollapsibleCard('backgrounds', 'Backgrounds', '🖼️', (
                <div>
                    <form onSubmit={handleBackgroundSearch} className="flex items-center gap-1 mb-0.5">
                        <input
                            type="text"
                            value={backgroundQuery}
                            onChange={(e) => setBackgroundQuery(e.target.value)}
                            placeholder="Search for backgrounds..."
                            className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <FaviconDropdown
                            options={BACKGROUND_APIS}
                            value={backgroundApi}
                            onChange={setBackgroundApi}
                            className="min-w-[100px]"
                            accentColor={accentColor}
                        />
                        <Button type="submit" disabled={backgroundLoading || !backgroundQuery.trim()} size="sm">{backgroundLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    
                    {/* API Key Information */}
                    {['unsplash', 'pexels', 'pixabay', 'deviantart'].includes(backgroundApi) && (
                        <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-500">🔑</span>
                                <div>
                                    <p className="text-blue-500 font-medium mb-1">
                                        API Key Required for {BACKGROUND_APIS.find(a => a.value === backgroundApi)?.label}
                                    </p>
                                    <p className="text-muted-foreground mb-1">
                                        {backgroundApi === 'unsplash' && 'Get free API key at https://unsplash.com/developers'}
                                        {backgroundApi === 'pexels' && 'Get free API key at https://www.pexels.com/api/'}
                                        {backgroundApi === 'pixabay' && 'Get free API key at https://pixabay.com/api/docs/'}
                                        {backgroundApi === 'deviantart' && 'Get API key at https://www.deviantart.com/developers/'}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Add your API key in the Advanced Panel → API Keys section
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Free Services Info */}
                    {['wallhaven', 'artstation'].includes(backgroundApi) && (
                        <div className="mb-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs">
                            <div className="flex items-start gap-2">
                                <span className="text-green-500">✅</span>
                                <div>
                                    <p className="text-green-500 font-medium mb-1">
                                        No API Key Required
                                    </p>
                                    <p className="text-muted-foreground">
                                        {BACKGROUND_APIS.find(a => a.value === backgroundApi)?.label} is free to use without registration
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {backgroundLoading && <div className="text-center text-xs">Loading...</div>}
                    {!backgroundLoading && backgroundSearched && backgroundResults.length === 0 && <div className="text-center text-muted-foreground text-xs">No results found.</div>}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                        {getPaginatedItems(backgroundResults, backgroundPage).map((bg) => {
                            const imageUrl = getProxiedImageUrl(bg.thumbs?.large || bg.thumbs?.original || bg.path);
                            return (
                                <div key={bg.id} className="relative group cursor-pointer bg-slate-800 rounded-md overflow-hidden" onClick={() => setModalContent({ type: 'background', data: { ...bg, preview: bg.thumbs?.large || bg.thumbs?.original, full: bg.path } })}>
                                    {imageUrl && (
                                        <img src={imageUrl} alt={bg.id} className="w-full h-16 object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-center text-xs p-0.5">{bg.id}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {getTotalPages(backgroundResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage(backgroundPage - 1)} disabled={backgroundPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {backgroundPage + 1} of {getTotalPages(backgroundResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage(backgroundPage + 1)} disabled={backgroundPage >= getTotalPages(backgroundResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ))}

            {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title={
                        modalContent.type === 'gif' ? modalContent.data.title :
                            modalContent.type === 'svg' ? modalContent.data.name :
                                modalContent.type === 'background' ? modalContent.data.id :
                                    'Emoji Preview'
                    }
                    actions={getModalActions(modalContent.type, modalContent.data)}
                >
                    {modalContent.type === 'gif' && <img src={modalContent.data.images.original.url} alt={modalContent.data.title} className="max-w-full max-h-[70vh] mx-auto" />}
                    {modalContent.type === 'svg' && <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto"><div className="w-full h-full flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" dangerouslySetInnerHTML={{ __html: modalContent.data.svg }} /></div>}
                    {modalContent.type === 'emoji' && <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto"><div className="text-[12rem] leading-none">{getEmojiChar(modalContent.data)}</div></div>}
                    {modalContent.type === 'background' && (
                        renderBackgroundModal(modalContent.data)
                    )}
                    {modalContent.type === 'sticker' && (
                        <div className="p-4 bg-transparent rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto">
                            <img
                                src={modalContent.data.images?.original?.url || modalContent.data.png_url}
                                alt={modalContent.data.title || modalContent.data.name}
                                className="max-w-full max-h-full object-contain bg-transparent"
                                style={{ mixBlendMode: 'normal', backgroundColor: 'transparent' }}
                                onError={e => {
                                    if (e.currentTarget.src && !e.currentTarget.src.endsWith('/broken-image.png')) {
                                        e.currentTarget.src = '/broken-image.png';
                                    }
                                }}
                            />
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
});

export default StreamingAssetsTab;
