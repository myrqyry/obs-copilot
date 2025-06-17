import React, { useState } from 'react';
import { Card, CardContent } from './ui';
import { Modal } from './common/Modal';
import { cn } from '../lib/utils';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { FaviconDropdown } from './common/FaviconDropdown';
import { FaviconIcon } from './common/FaviconIcon';
import { useAppStore } from '../store/appStore';
import HtmlTemplateBuilder from './HtmlTemplateBuilder';
// Define ModalAction type if not imported from elsewhere
type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};
import {
    addBrowserSource,
    addImageSource,
    addMediaSource,
    addSvgAsBrowserSource,
    addEmojiAsBrowserSource,
    copyToClipboard,
    generateSourceName
} from '../utils/obsSourceHelpers';

// Initialize Giphy Fetch with public API key
// Note: This is a demo key - replace with your own for production
const gf = new GiphyFetch('GlVGYHkr3WSBnllca54iNt0yFbjz7L65');

// Supported APIs with favicon domains
const SVG_APIS = [
    { label: 'Iconify', value: 'iconify', domain: 'iconify.design' },
    { label: 'Material Symbols', value: 'material-symbols', domain: 'fonts.google.com' },
    { label: 'Tabler Icons', value: 'tabler', domain: 'tabler-icons.io' },
];
const EMOJI_APIS = [
    { label: 'Open Emoji API', value: 'openemoji', domain: 'openmoji.org' },
    { label: 'EmojiHub API', value: 'emojihub', domain: 'emojihub.yurace.pro' },
    { label: 'Emoji Family API', value: 'emojifamily', domain: 'emojifamily.com' },
    { label: 'Unicode Static', value: 'unicode', domain: 'unicode.org' },
];

type SvgResult = { name: string; svg: string };
type EmojiResult = { [key: string]: any };

export default function StreamingAssetsTab() {
    // Current tab state
    const [activeAssetTab, setActiveAssetTab] = useState<'html-templates' | 'giphy' | 'svg' | 'emoji'>('html-templates');

    // Get theme for consistent styling
    const theme = useAppStore(state => state.theme);

    // Giphy
    const [giphyQuery, setGiphyQuery] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [giphyLoading, setGiphyLoading] = useState(false);
    const [giphyPage, setGiphyPage] = useState(0);
    const [giphySearched, setGiphySearched] = useState(false);

    // SVG
    const [svgQuery, setSvgQuery] = useState('');
    const [svgApi, setSvgApi] = useState('iconify');
    const [svgResults, setSvgResults] = useState<SvgResult[]>([]);
    const [svgLoading, setSvgLoading] = useState(false);
    const [svgPage, setSvgPage] = useState(0);
    const [svgSearched, setSvgSearched] = useState(false);

    // Emoji
    const [emojiQuery, setEmojiQuery] = useState('');
    const [emojiApi, setEmojiApi] = useState('emojihub');
    const [emojiResults, setEmojiResults] = useState<EmojiResult[]>([]);
    const [emojiLoading, setEmojiLoading] = useState(false);
    const [emojiPage, setEmojiPage] = useState(0);
    const [emojiSearched, setEmojiSearched] = useState(false);

    // Modal for full-size viewing
    const [modalContent, setModalContent] = useState<{ type: 'gif' | 'svg' | 'emoji', data: any } | null>(null);

    // OBS integration - use separate selectors to avoid object recreation
    const obsServiceInstance = useAppStore(state => state.obsServiceInstance);
    const currentProgramScene = useAppStore(state => state.currentProgramScene);
    const isConnected = useAppStore(state => state.isConnected);

    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Pagination constants
    const ITEMS_PER_PAGE = 12; // 4x3 grid

    // Helper functions for pagination
    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

    // Giphy search handler using official SDK
    const handleGiphySearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!giphyQuery.trim()) {
            console.warn('Empty search query');
            return;
        }

        setGiphyLoading(true);
        setGiphyResults([]);
        setGiphyPage(0); // Reset to first page
        setGiphySearched(true); // Mark that a search has been performed

        try {
            console.log('Starting Giphy SDK search for:', giphyQuery);

            // Use the official Giphy SDK to search for GIFs
            const response = await gf.search(giphyQuery, { limit: 24, rating: 'g' });
            console.log('Giphy SDK response:', response);

            if (response.data && Array.isArray(response.data)) {
                // Transform SDK response to match our expected format
                const transformedResults = response.data.map((gif: any) => ({
                    id: gif.id,
                    title: gif.title,
                    images: {
                        fixed_height_small: { url: gif.images.fixed_height_small?.url },
                        original: { url: gif.images.original?.url },
                        downsized_small: { url: gif.images.downsized_small?.url }
                    }
                }));

                setGiphyResults(transformedResults);
                console.log('Set Giphy results:', transformedResults.length, 'items');
            } else {
                console.warn('No data found in Giphy SDK response');
                setGiphyResults([]);
            }
        } catch (err) {
            console.error('Giphy SDK fetch error:', err);
            setGiphyResults([]);
        }
        setGiphyLoading(false);
    };

    // SVG search handler
    const handleSvgSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!svgQuery.trim()) {
            console.warn('Empty search query');
            return;
        }

        setSvgLoading(true);
        setSvgResults([]);
        setSvgPage(0); // Reset to first page
        setSvgSearched(true); // Mark that a search has been performed

        try {
            if (svgApi === 'iconify') {
                console.log('Searching Iconify for:', svgQuery);
                const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(svgQuery)}&limit=24`);
                if (!res.ok) {
                    console.error('Iconify API error:', res.status, res.statusText);
                    setSvgResults([]);
                    return;
                }
                const data = await res.json();
                console.log('Iconify search response:', data);

                if (data.icons && Array.isArray(data.icons)) {
                    // Fetch SVG content for each icon
                    const svgFetches = data.icons.map(async (iconName: string) => {
                        try {
                            const svgRes = await fetch(`https://api.iconify.design/${iconName}.svg`);
                            if (svgRes.ok) {
                                return { name: iconName, svg: await svgRes.text() };
                            }
                        } catch (err) {
                            console.warn('Failed to fetch SVG for:', iconName);
                        }
                        return null;
                    });
                    const results = await Promise.all(svgFetches);
                    setSvgResults(results.filter(r => r !== null) as SvgResult[]);
                } else {
                    setSvgResults([]);
                }
            } else if (svgApi === 'material-symbols') {
                console.log('Searching Material Symbols...');
                const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(svgQuery)}&prefix=material-symbols&limit=24`);
                if (!res.ok) {
                    console.error('Material Symbols API error:', res.status, res.statusText);
                    setSvgResults([]);
                    return;
                }
                const data = await res.json();

                if (data.icons && Array.isArray(data.icons)) {
                    const svgFetches = data.icons.map(async (iconName: string) => {
                        try {
                            const svgRes = await fetch(`https://api.iconify.design/${iconName}.svg`);
                            if (svgRes.ok) {
                                return { name: iconName.replace('material-symbols:', ''), svg: await svgRes.text() };
                            }
                        } catch (err) {
                            console.warn('Failed to fetch SVG for:', iconName);
                        }
                        return null;
                    });
                    const results = await Promise.all(svgFetches);
                    setSvgResults(results.filter(r => r !== null) as SvgResult[]);
                } else {
                    setSvgResults([]);
                }
            } else if (svgApi === 'tabler') {
                console.log('Searching Tabler Icons...');
                const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(svgQuery)}&prefix=tabler&limit=24`);
                if (!res.ok) {
                    console.error('Tabler Icons API error:', res.status, res.statusText);
                    setSvgResults([]);
                    return;
                }
                const data = await res.json();

                if (data.icons && Array.isArray(data.icons)) {
                    const svgFetches = data.icons.map(async (iconName: string) => {
                        try {
                            const svgRes = await fetch(`https://api.iconify.design/${iconName}.svg`);
                            if (svgRes.ok) {
                                return { name: iconName.replace('tabler:', ''), svg: await svgRes.text() };
                            }
                        } catch (err) {
                            console.warn('Failed to fetch SVG for:', iconName);
                        }
                        return null;
                    });
                    const results = await Promise.all(svgFetches);
                    setSvgResults(results.filter(r => r !== null) as SvgResult[]);
                } else {
                    setSvgResults([]);
                }
            }
        } catch (err) {
            console.error('SVG fetch error:', err);
            setSvgResults([]);
        }
        setSvgLoading(false);
    };

    // Emoji search handler
    const handleEmojiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emojiQuery.trim()) {
            console.warn('Empty search query');
            return;
        }

        setEmojiLoading(true);
        setEmojiResults([]);
        setEmojiPage(0); // Reset to first page
        setEmojiSearched(true); // Mark that a search has been performed

        try {
            if (emojiApi === 'emojihub') {
                console.log('Searching EmojiHub API for:', emojiQuery);
                const res = await fetch('https://emojihub.yurace.pro/api/all');

                if (!res.ok) {
                    console.error('EmojiHub API error:', res.status, res.statusText);
                    // Fallback to static emojis if API fails
                    const fallbackEmojis = [
                        { name: 'red heart', category: 'smileys-and-people', group: 'face-positive', htmlCode: ['&#10084;'], unicode: ['U+2764'] },
                        { name: 'smiling face with smiling eyes', category: 'smileys-and-people', group: 'face-positive', htmlCode: ['&#128522;'], unicode: ['U+1F60A'] },
                        { name: 'thumbs up', category: 'smileys-and-people', group: 'body', htmlCode: ['&#128077;'], unicode: ['U+1F44D'] },
                        { name: 'fire', category: 'travel-and-places', group: 'travel-and-places', htmlCode: ['&#128525;'], unicode: ['U+1F525'] },
                        { name: 'star', category: 'travel-and-places', group: 'travel-and-places', htmlCode: ['&#11088;'], unicode: ['U+2B50'] },
                        { name: 'rocket', category: 'travel-and-places', group: 'travel-and-places', htmlCode: ['&#128640;'], unicode: ['U+1F680'] },
                        { name: 'cat face', category: 'animals-and-nature', group: 'animal-mammal', htmlCode: ['&#128049;'], unicode: ['U+1F431'] },
                        { name: 'dog face', category: 'animals-and-nature', group: 'animal-mammal', htmlCode: ['&#128054;'], unicode: ['U+1F436'] },
                    ].filter(emoji =>
                        emoji.name.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.category.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.group.toLowerCase().includes(emojiQuery.toLowerCase())
                    );
                    setEmojiResults(fallbackEmojis);
                    return;
                }

                const data = await res.json();
                console.log('EmojiHub API response:', data);

                if (Array.isArray(data)) {
                    // Filter emojis based on search query
                    const filtered = data.filter((emoji: any) =>
                        emoji.name.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.category.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.group.toLowerCase().includes(emojiQuery.toLowerCase())
                    ).slice(0, 24);
                    setEmojiResults(filtered);
                } else {
                    setEmojiResults([]);
                }
            } else if (emojiApi === 'emojifamily') {
                console.log('Searching Emoji Family API for:', emojiQuery);
                const res = await fetch(`https://www.emoji.family/api/emojis?search=${encodeURIComponent(emojiQuery)}`);

                if (!res.ok) {
                    console.error('Emoji Family API error:', res.status, res.statusText);
                    // Fallback to static emojis if API fails
                    const fallbackEmojis = [
                        { emoji: '❤️', name: 'red heart', group: 'smileys-emotion', subgroup: 'emotion', shortcodes: ['heart'] },
                        { emoji: '😊', name: 'smiling face with smiling eyes', group: 'smileys-emotion', subgroup: 'face-smiling', shortcodes: ['smile'] },
                        { emoji: '👍', name: 'thumbs up', group: 'people-body', subgroup: 'hand-fingers-closed', shortcodes: ['thumbs_up'] },
                        { emoji: '🔥', name: 'fire', group: 'travel-places', subgroup: 'sky-weather', shortcodes: ['fire'] },
                        { emoji: '⭐', name: 'star', group: 'travel-places', subgroup: 'sky-weather', shortcodes: ['star'] },
                        { emoji: '🚀', name: 'rocket', group: 'travel-places', subgroup: 'transport-air', shortcodes: ['rocket'] },
                        { emoji: '🐱', name: 'cat face', group: 'animals-nature', subgroup: 'animal-mammal', shortcodes: ['cat'] },
                        { emoji: '🐶', name: 'dog face', group: 'animals-nature', subgroup: 'animal-mammal', shortcodes: ['dog'] },
                    ].filter(emoji =>
                        emoji.name.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.group.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.subgroup.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.shortcodes.some(code => code.toLowerCase().includes(emojiQuery.toLowerCase()))
                    );
                    setEmojiResults(fallbackEmojis);
                    return;
                }

                const data = await res.json();
                console.log('Emoji Family API response:', data);

                if (Array.isArray(data)) {
                    setEmojiResults(data.slice(0, 24));
                } else {
                    setEmojiResults([]);
                }
            } else if (emojiApi === 'openemoji') {
                console.log('Searching Open Emoji API for:', emojiQuery);
                // Note: You need a free API key from emoji-api.com
                // Get your free key at: https://emoji-api.com/ 
                // For demo purposes, we'll use a mock key - replace with your actual key
                const apiKey = '99e3ed8c1216ba115deec7b4d46dd5bca5ef1a6b'; // Replace with actual API key from emoji-api.com
                const res = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(emojiQuery)}&access_key=${apiKey}`);

                if (!res.ok) {
                    console.error('Open Emoji API error:', res.status, res.statusText);
                    // Fallback to static emojis if API fails
                    const fallbackEmojis = [
                        { slug: 'heart', character: '❤️', unicodeName: 'red heart', codePoint: '2764', group: 'smileys-emotion' },
                        { slug: 'smile', character: '😊', unicodeName: 'smiling face with smiling eyes', codePoint: '1F60A', group: 'smileys-emotion' },
                        { slug: 'thumbs-up', character: '👍', unicodeName: 'thumbs up', codePoint: '1F44D', group: 'people-body' },
                        { slug: 'fire', character: '🔥', unicodeName: 'fire', codePoint: '1F525', group: 'travel-places' },
                        { slug: 'star', character: '⭐', unicodeName: 'star', codePoint: '2B50', group: 'travel-places' },
                        { slug: 'rocket', character: '🚀', unicodeName: 'rocket', codePoint: '1F680', group: 'travel-places' },
                        { slug: 'cat', character: '🐱', unicodeName: 'cat face', codePoint: '1F431', group: 'animals-nature' },
                        { slug: 'dog', character: '🐶', unicodeName: 'dog face', codePoint: '1F436', group: 'animals-nature' },
                    ].filter(emoji =>
                        emoji.slug.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                        emoji.unicodeName.toLowerCase().includes(emojiQuery.toLowerCase())
                    );
                    setEmojiResults(fallbackEmojis);
                    return;
                }

                const data = await res.json();
                console.log('Open Emoji API response:', data);

                if (Array.isArray(data)) {
                    setEmojiResults(data.slice(0, 24));
                } else {
                    setEmojiResults([]);
                }
            } else if (emojiApi === 'unicode') {
                console.log('Using Unicode static emoji list...');
                // Static list of common emojis for demo
                const staticEmojis = [
                    { slug: 'heart', character: '❤️', unicodeName: 'red heart', codePoint: '2764', group: 'smileys-emotion' },
                    { slug: 'smile', character: '😊', unicodeName: 'smiling face with smiling eyes', codePoint: '1F60A', group: 'smileys-emotion' },
                    { slug: 'grinning', character: '😀', unicodeName: 'grinning face', codePoint: '1F600', group: 'smileys-emotion' },
                    { slug: 'laughing', character: '', unicodeName: 'face with tears of joy', codePoint: '1F602', group: 'smileys-emotion' },
                    { slug: 'thumbs-up', character: '👍', unicodeName: 'thumbs up', codePoint: '1F44D', group: 'people-body' },
                    { slug: 'thumbs-down', character: '', unicodeName: 'thumbs down', codePoint: '1F44E', group: 'people-body' },
                    { slug: 'fire', character: '🔥', unicodeName: 'fire', codePoint: '1F525', group: 'travel-places' },
                    { slug: 'star', character: '⭐', unicodeName: 'star', codePoint: '2B50', group: 'travel-places' },
                    { slug: 'rocket', character: '🚀', unicodeName: 'rocket', codePoint: '1F680', group: 'travel-places' },
                    { slug: 'cat', character: '🐱', unicodeName: 'cat face', codePoint: '1F431', group: 'animals-nature' },
                    { slug: 'dog', character: '🐶', unicodeName: 'dog face', codePoint: '1F436', group: 'animals-nature' },
                    { slug: 'party', character: '🎉', unicodeName: 'party popper', codePoint: '1F389', group: 'activities' },
                    { slug: 'balloon', character: '🎈', unicodeName: 'balloon', codePoint: '1F388', group: 'activities' },
                    { slug: 'pizza', character: '🍕', unicodeName: 'pizza', codePoint: '1F355', group: 'food-drink' },
                    { slug: 'coffee', character: '☕', unicodeName: 'hot beverage', codePoint: '2615', group: 'food-drink' },
                    { slug: 'home', character: '🏠', unicodeName: 'house', codePoint: '1F3E0', group: 'travel-places' },
                    { slug: 'car', character: '🚗', unicodeName: 'automobile', codePoint: '1F697', group: 'travel-places' },
                    { slug: 'phone', character: '📱', unicodeName: 'mobile phone', codePoint: '1F4F1', group: 'objects' },
                    { slug: 'computer', character: '💻', unicodeName: 'laptop computer', codePoint: '1F4BB', group: 'objects' },
                    { slug: 'music', character: '🎵', unicodeName: 'musical note', codePoint: '1F3B5', group: 'objects' },
                    { slug: 'camera', character: '', unicodeName: 'camera', codePoint: '1F4F7', group: 'objects' },
                    { slug: 'book', character: '📚', unicodeName: 'books', codePoint: '1F4DA', group: 'objects' },
                    { slug: 'money', character: '', unicodeName: 'money bag', codePoint: '1F4B0', group: 'objects' },
                    { slug: 'gift', character: '🎁', unicodeName: 'wrapped gift', codePoint: '1F381', group: 'activities' },
                ];

                const filtered = staticEmojis.filter(emoji =>
                    emoji.slug.toLowerCase().includes(emojiQuery.toLowerCase()) ||
                    emoji.unicodeName.toLowerCase().includes(emojiQuery.toLowerCase())
                );
                setEmojiResults(filtered);
            }
        } catch (err) {
            console.error('Emoji fetch error:', err);
            setEmojiResults([]);
        }
        setEmojiLoading(false);
    };

    // OBS Action Helpers
    const showFeedback = (message: string) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleAddBrowserSource = async (url: string, baseName: string, searchQuery?: string) => {
        if (!obsServiceInstance || !isConnected) {
            showFeedback('❌ Not connected to OBS');
            return;
        }

        const sourceName = generateSourceName(baseName, searchQuery);
        try {
            await addBrowserSource(url, sourceName, {
                obsService: obsServiceInstance,
                currentScene: currentProgramScene,
                onSuccess: showFeedback,
                onError: showFeedback
            });
        } catch (error) {
            console.error('Failed to add browser source:', error);
        }
    };

    const handleAddImageSource = async (imageUrl: string, baseName: string, searchQuery?: string) => {
        if (!obsServiceInstance || !isConnected) {
            showFeedback('❌ Not connected to OBS');
            return;
        }

        const sourceName = generateSourceName(baseName, searchQuery);
        try {
            await addImageSource(imageUrl, sourceName, {
                obsService: obsServiceInstance,
                currentScene: currentProgramScene,
                onSuccess: showFeedback,
                onError: showFeedback
            });
        } catch (error) {
            console.error('Failed to add image source:', error);
        }
    };

    const handleAddMediaSource = async (mediaUrl: string, baseName: string, searchQuery?: string) => {
        if (!obsServiceInstance || !isConnected) {
            showFeedback('❌ Not connected to OBS');
            return;
        }

        const sourceName = generateSourceName(baseName, searchQuery);
        try {
            await addMediaSource(mediaUrl, sourceName, {
                obsService: obsServiceInstance,
                currentScene: currentProgramScene,
                onSuccess: showFeedback,
                onError: showFeedback
            });
        } catch (error) {
            console.error('Failed to add media source:', error);
        }
    };

    const handleAddSvgSource = async (svgContent: string, baseName: string, searchQuery?: string) => {
        if (!obsServiceInstance || !isConnected) {
            showFeedback('❌ Not connected to OBS');
            return;
        }

        const sourceName = generateSourceName(baseName, searchQuery);
        try {
            await addSvgAsBrowserSource(svgContent, sourceName, {
                obsService: obsServiceInstance,
                currentScene: currentProgramScene,
                onSuccess: showFeedback,
                onError: showFeedback
            });
        } catch (error) {
            console.error('Failed to add SVG source:', error);
        }
    };

    const handleAddEmojiSource = async (emoji: string, baseName: string, searchQuery?: string) => {
        if (!obsServiceInstance || !isConnected) {
            showFeedback('❌ Not connected to OBS');
            return;
        }

        const sourceName = generateSourceName(baseName, searchQuery);
        try {
            await addEmojiAsBrowserSource(emoji, sourceName, {
                obsService: obsServiceInstance,
                currentScene: currentProgramScene,
                onSuccess: showFeedback,
                onError: showFeedback
            });
        } catch (error) {
            console.error('Failed to add emoji source:', error);
        }
    };

    const handleCopyToClipboard = async (text: string, itemName: string) => {
        try {
            await copyToClipboard(text);
            showFeedback(`✅ Copied ${itemName} to clipboard`);
        } catch (error) {
            showFeedback(`❌ Failed to copy ${itemName}`);
        }
    };

    // Get modal actions based on content type
    const getModalActions = () => {
        if (!modalContent) return [];

        const actions: ModalAction[] = [];

        switch (modalContent.type) {
            case 'gif':
                const gifUrl = modalContent.data.images?.original?.url || modalContent.data.images?.fixed_height?.url;
                actions.push({
                    label: 'Add as Browser Source',
                    onClick: () => handleAddBrowserSource(gifUrl, 'gif', giphyQuery),
                    variant: 'primary'
                });

                actions.push({
                    label: 'Add as Media Source',
                    onClick: () => handleAddMediaSource(gifUrl, 'gif-media', giphyQuery),
                    variant: 'secondary'
                });

                actions.push({
                    label: 'Copy URL',
                    onClick: () => handleCopyToClipboard(gifUrl, 'GIF URL'),
                    variant: 'secondary'
                });
                break;

            case 'svg':
                const svgContent = modalContent.data.svg;

                actions.push({
                    label: 'Add as Browser Source',
                    onClick: () => handleAddSvgSource(svgContent, 'svg', svgQuery),
                    variant: 'primary'
                });

                actions.push({
                    label: 'Add as Image Source',
                    onClick: () => handleAddImageSource(`data:image/svg+xml;base64,${btoa(svgContent)}`, 'svg-image', svgQuery),
                    variant: 'secondary'
                });

                actions.push({
                    label: 'Copy SVG Code',
                    onClick: () => handleCopyToClipboard(svgContent, 'SVG code'),
                    variant: 'secondary'
                });
                break;

            case 'emoji':
                let emojiChar = '';
                // Handle different API response formats
                if (modalContent.data.character) {
                    emojiChar = modalContent.data.character; // Open Emoji API format
                } else if (modalContent.data.emoji) {
                    emojiChar = modalContent.data.emoji; // Emoji Family API format
                } else if (modalContent.data.htmlCode && Array.isArray(modalContent.data.htmlCode)) {
                    // EmojiHub API format - convert HTML entity to character
                    const htmlEntity = modalContent.data.htmlCode[0];
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlEntity;
                    emojiChar = tempDiv.textContent || tempDiv.innerText || htmlEntity;
                } else if (modalContent.data.unicode) {
                    emojiChar = modalContent.data.unicode; // fallback format
                } else {
                    emojiChar = modalContent.data; // primitive fallback
                }

                actions.push({
                    label: 'Add as Browser Source',
                    onClick: () => handleAddEmojiSource(emojiChar, 'emoji', emojiQuery),
                    variant: 'primary'
                });

                actions.push({
                    label: 'Copy Emoji',
                    onClick: () => handleCopyToClipboard(emojiChar, 'emoji'),
                    variant: 'secondary'
                });
                break;
        }

        return actions;
    };

    // Tab configuration
    const assetTabs = [
        { id: 'html-templates' as const, label: '🌐 HTML Templates', icon: '🌐' },
        { id: 'giphy' as const, label: '🎞️ GIFs', icon: '🎞️' },
        { id: 'svg' as const, label: '🎨 SVG Icons', icon: '🎨' },
        { id: 'emoji' as const, label: '😊 Emojis', icon: '😊' }
    ];

    return (
        <div className="p-1 space-y-4">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                {assetTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveAssetTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200",
                            activeAssetTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <span className="text-sm">{tab.icon}</span>
                        <span className="text-sm">{tab.label.split(' ')[1]}</span>
                    </button>
                ))}
            </div>

            {/* HTML Templates Tab */}
            {activeAssetTab === 'html-templates' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <span>🌐</span>
                        <span>HTML Template Builder</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                        Create dynamic HTML templates for OBS browser sources. Perfect for overlays, alerts,
                        custom pages, and displaying assets from the other tabs.
                    </div>
                    <HtmlTemplateBuilder accentColorName={theme.accent} />
                </div>
            )}

            {/* Giphy Tab */}
            {activeAssetTab === 'giphy' && (
                <Card className="border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-4">
                            <FaviconIcon domain="giphy.com" size={24} />
                            <span className="text-lg font-semibold text-foreground">Giphy Search</span>
                        </div>

                        <form onSubmit={handleGiphySearch} className="flex gap-2 mb-4">
                            <input
                                className="border rounded px-3 py-2 flex-1 bg-background text-foreground border-border"
                                placeholder="Search Giphy for GIFs..."
                                value={giphyQuery}
                                onChange={e => setGiphyQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={giphyLoading}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {giphyLoading ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        {giphyLoading && (
                            <div className="text-sm text-muted-foreground">Loading GIFs...</div>
                        )}

                        {!giphyLoading && giphyQuery && giphyResults.length === 0 && giphySearched && (
                            <div className="text-sm text-muted-foreground">No GIFs found. Try a different search term.</div>
                        )}

                        {giphyResults.length > 0 && (
                            <>
                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setGiphyPage(Math.max(0, giphyPage - 1))}
                                        disabled={giphyPage === 0}
                                        className="flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {giphyPage + 1} of {getTotalPages(giphyResults)}
                                    </span>
                                    <button
                                        onClick={() => setGiphyPage(Math.min(getTotalPages(giphyResults) - 1, giphyPage + 1))}
                                        disabled={giphyPage === getTotalPages(giphyResults) - 1}
                                        className="flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next →
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {getPaginatedItems(giphyResults, giphyPage).map(gif => (
                                        <div key={gif.id} className="relative group">
                                            <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-auto rounded-md" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setModalContent({ type: 'gif', data: gif })}
                                                    className="bg-primary text-primary-foreground px-4 py-2 rounded shadow-sm hover:bg-primary/90 transition-colors"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* SVG Tab */}
            {activeAssetTab === 'svg' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <span>🎨</span>
                        <span>SVG Icon Search</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                        Search and insert SVG icons from various sources. Great for logos, illustrations, and detailed graphics.
                    </div>

                    <form onSubmit={handleSvgSearch} className="flex gap-2 mb-4">
                        <input
                            className="border rounded px-3 py-2 flex-1 bg-background text-foreground border-border"
                            placeholder="Search SVG icons..."
                            value={svgQuery}
                            onChange={e => setSvgQuery(e.target.value)}
                        />
                        <FaviconDropdown
                            value={svgApi}
                            onChange={setSvgApi}
                            options={SVG_APIS}
                        />
                    </form>

                    {svgLoading && (
                        <div className="text-sm text-muted-foreground">Loading SVGs...</div>
                    )}

                    {!svgLoading && svgQuery && svgResults.length === 0 && svgSearched && (
                        <div className="text-sm text-muted-foreground">No SVGs found. Try a different search term.</div>
                    )}

                    {svgResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {getPaginatedItems(svgResults, svgPage).map(svg => (
                                <div key={svg.name} className="relative group">
                                    <div className="w-full h-auto rounded-md" dangerouslySetInnerHTML={{ __html: svg.svg }} />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setModalContent({ type: 'svg', data: svg })}
                                            className="bg-primary text-primary-foreground px-4 py-2 rounded shadow-sm hover:bg-primary/90 transition-colors"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setSvgPage(Math.max(0, svgPage - 1))}
                            disabled={svgPage === 0}
                            className="flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-muted-foreground">
                            Page {svgPage + 1} of {getTotalPages(svgResults)}
                        </span>
                        <button
                            onClick={() => setSvgPage(Math.min(getTotalPages(svgResults) - 1, svgPage + 1))}
                            disabled={svgPage === getTotalPages(svgResults) - 1}
                            className="flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Emoji Tab */}
            {activeAssetTab === 'emoji' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <span>😊</span>
                        <span>Emoji Search</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                        Search and use emojis from various sources. Perfect for chat overlays, reactions, and enhancing viewer engagement.
                    </div>

                    <form onSubmit={handleEmojiSearch} className="flex gap-2 mb-4">
                        <input
                            className="border rounded px-3 py-2 flex-1 bg-background text-foreground border-border"
                            placeholder="Search emojis..."
                            value={emojiQuery}
                            onChange={e => setEmojiQuery(e.target.value)}
                        />
                        <FaviconDropdown
                            value={emojiApi}
                            onChange={setEmojiApi}
                            options={EMOJI_APIS}
                        />
                    </form>

                    {emojiLoading && (
                        <div className="text-sm text-muted-foreground">Loading emojis...</div>
                    )}

                    {!emojiLoading && emojiQuery && emojiResults.length === 0 && emojiSearched && (
                        <div className="text-sm text-muted-foreground">No emojis found. Try a different search term.</div>
                    )}

                    {emojiResults.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {getPaginatedItems(emojiResults, emojiPage).map(emoji => (
                                <div key={emoji.name} className="relative group">
                                    <div className="w-full h-auto rounded-md" dangerouslySetInnerHTML={{ __html: emoji.character }} />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setModalContent({ type: 'emoji', data: emoji })}
                                            className="bg-primary text-primary-foreground px-4 py-2 rounded shadow-sm hover:bg-primary/90 transition-colors"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setEmojiPage(Math.max(0, emojiPage - 1))}
                            disabled={emojiPage === 0}
                            className="flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-muted-foreground">
                            Page {emojiPage + 1} of {getTotalPages(emojiResults)}
                        </span>
                        <button
                            onClick={() => setEmojiPage(Math.min(getTotalPages(emojiResults) - 1, emojiPage + 1))}
                            disabled={emojiPage === getTotalPages(emojiResults) - 1}
                            className="flex items-center px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {/* Modal for full-size viewing */}
            {modalContent && (
                <Modal
                    title={modalContent.type === 'gif' ? 'GIF Preview' : modalContent.type === 'svg' ? 'SVG Preview' : 'Emoji Preview'}
                    onClose={() => setModalContent(null)}
                    actions={getModalActions()}
                >
                    {modalContent.type === 'gif' && (
                        <img src={modalContent.data.images?.original?.url || modalContent.data.images?.fixed_height?.url} alt="GIF" className="w-full h-auto" />
                    )}
                    {modalContent.type === 'svg' && (
                        <div className="w-full h-auto" dangerouslySetInnerHTML={{ __html: modalContent.data.svg }} />
                    )}
                    {modalContent.type === 'emoji' && (
                        <div className="w-full h-auto" dangerouslySetInnerHTML={{ __html: modalContent.data.character }} />
                    )}
                </Modal>
            )}

            {/* Feedback Message */}
            {feedbackMessage && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded shadow-md">
                    {feedbackMessage}
                </div>
            )}
        </div>
    );
}
