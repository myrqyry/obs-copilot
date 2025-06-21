// Add at the top or after imports
import './StreamingAssetsTab.css';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { getCustomApiKey } from './AdvancedPanel';
import React, { useState } from 'react';
// Import CSS for SVG scaling
import './StreamingAssetsTab.css';
import { useAppStore } from '../store/appStore';
import { addBrowserSource, addMediaSource, addSvgAsBrowserSource, addEmojiAsBrowserSource, addImageSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import HtmlTemplateBuilder from './HtmlTemplateBuilder';
import { Modal } from './common/Modal';
import { Button } from './ui/Button';
import { FaviconIcon } from './common/FaviconIcon';
import { FaviconDropdown } from './common/FaviconDropdown';
import { cn } from '../lib/utils';


// Prefer user API key if set, else fallback to env
const getGiphyApiKey = () => getCustomApiKey('giphy') || import.meta.env.VITE_GIPHY_API_KEY || '';
const getTenorApiKey = () => getCustomApiKey('tenor') || import.meta.env.VITE_TENOR_API_KEY || '';
const GIF_APIS = [
    { label: 'Giphy', value: 'giphy', domain: 'giphy.com' },
    { label: 'Tenor', value: 'tenor', domain: 'tenor.com' },
];

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

// Memoize the Giphy API key to avoid unnecessary re-initializations
const giphyApiKey = React.useMemo(() => getGiphyApiKey(), [getCustomApiKey('giphy')]);
// GiphyFetch instance must be recreated if key changes
let gf = new GiphyFetch(giphyApiKey);

const SVG_APIS = [
    { label: 'Iconify', value: 'iconify', domain: 'iconify.design' },
    { label: 'Material Symbols', value: 'material-symbols', domain: 'fonts.google.com' },
    { label: 'Tabler Icons', value: 'tabler', domain: 'tabler-icons.io' },
    { label: 'Iconfinder', value: 'iconfinder', domain: 'iconfinder.com' },
];

// Common SVG icons for header display
const COMMON_SVGS = [
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>', // star
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>', // check circle
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l.09.98c.6.05 1.19.16 1.77.32l.72-1.71c-.8-.24-1.62-.4-2.46-.48L12 2zm4.64 2.64l-1.37 1.37c.47.33.9.73 1.28 1.17l1.71-.72c-.54-.65-1.15-1.24-1.85-1.82l.23-.0z"/></svg>', // settings
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v3h2v-3zm4 0h-2v3h2v-3zm4 0h-2v3h2v-3zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>', // calendar
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>', // menu
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8.5 16L12 13.5 15.5 16 12 18.5 8.5 16z"/></svg>', // diamond
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
    { label: 'EmojiHub API', value: 'emojihub', domain: 'emojihub.yurace.pro' },
    { label: 'Emoji Family API', value: 'emojifamily', domain: 'emojifamily.com' },
    { label: 'Open Emoji API', value: 'openemoji', domain: 'emoji-api.com' },
    { label: 'Unicode Static', value: 'unicode', domain: 'unicode.org' },
];

type SvgResult = { name: string; svg: string };
type EmojiResult = { [key: string]: any };

export default function StreamingAssetsTab() {
    // Recreate GiphyFetch if user key changes
    React.useEffect(() => {
        gf = new GiphyFetch(giphyApiKey);
    }, [giphyApiKey]);
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
    const BACKGROUND_APIS = [
        { label: 'Wallhaven', value: 'wallhaven', domain: 'wallhaven.cc' },
        // Add more APIs here later
    ];
    const [backgroundApi, setBackgroundApi] = useState('wallhaven');
    const [backgroundQuery, setBackgroundQuery] = useState('');
    const [backgroundResults, setBackgroundResults] = useState<any[]>([]);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [backgroundPage, setBackgroundPage] = useState(0);
    const [backgroundSearched, setBackgroundSearched] = useState(false);

    // --- Backgrounds Search Handler ---
    const handleBackgroundSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!backgroundQuery.trim()) return;
        setBackgroundLoading(true);
        setBackgroundResults([]);
        setBackgroundPage(0);
        setBackgroundSearched(true);
        try {
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
                const res = await fetch(apiUrl);
                const data = await res.json();
                setBackgroundResults(data.data.slice(0, 48));
            }
            // Add more APIs here later
        } catch (err) {
            console.error('Backgrounds fetch error:', err);
        }
        setBackgroundLoading(false);
    };

    // Random SVG for header - generate once per component render
    const [randomHeaderSvg] = useState(() => getRandomSvg());

    // Random emoji for header - generate once per component render
    const [randomHeaderEmoji] = useState(() => getRandomEmoji());


    // --- GIF Section State ---
    const [gifApi, setGifApi] = useState('giphy');
    const [gifQuery, setGifQuery] = useState('');
    const [gifResults, setGifResults] = useState<any[]>([]);
    const [gifLoading, setGifLoading] = useState(false);
    const [gifPage, setGifPage] = useState(0);
    const [gifSearched, setGifSearched] = useState(false);

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

    const [stickersQuery, setStickersQuery] = useState('');
    const [stickersResults, setStickersResults] = useState<any[]>([]);
    const [stickersLoading, setStickersLoading] = useState(false);
    const [stickersPage, setStickersPage] = useState(0);
    const [stickersSearched, setStickersSearched] = useState(false);
    const [modalContent, setModalContent] = useState<{ type: 'gif' | 'svg' | 'emoji' | 'background' | 'sticker', data: any } | null>(null);
    // --- Stickers Search Handler (Iconfinder, free stickers only) ---
    const handleStickersSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stickersQuery.trim()) return;
        setStickersLoading(true);
        setStickersResults([]);
        setStickersPage(0);
        setStickersSearched(true);
        try {
            const limit = 12 * 4; // 4 pages of 12 (4x3 grid)
            const params = new URLSearchParams({
                api: 'iconfinder',
                query: stickersQuery,
                count: String(limit),
                premium: '0',
                vector: '0',
                style: 'sticker',
            });
            const url = `/api/proxy?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Iconfinder API error');
            const data = await res.json();
            // Map stickers to add png_url from raster_sizes
            const stickers = (data.icons || []).map((icon: any) => {
                let png_url = undefined;
                if (icon.raster_sizes && icon.raster_sizes.length > 0) {
                    // Try all raster sizes, prefer largest, but fallback to any available PNG
                    for (let i = icon.raster_sizes.length - 1; i >= 0; i--) {
                        const raster = icon.raster_sizes[i];
                        if (raster.formats && raster.formats.length > 0) {
                            const pngFormat = raster.formats.find((f: any) => f.format === 'png');
                            if (pngFormat && pngFormat.download_url) {
                                png_url = pngFormat.download_url;
                                break;
                            }
                        }
                    }
                }
                return { ...icon, png_url };
            }).filter((icon: any) => icon.is_premium === false && icon.png_url);
            setStickersResults(stickers.slice(0, limit).map((icon: any) => ({
                name: icon.tags && icon.tags.length > 0 ? icon.tags[0] : icon.icon_id,
                img: `<img src="${icon.png_url}" alt="${icon.tags && icon.tags.length > 0 ? icon.tags[0] : icon.icon_id}" />`,
                png_url: icon.png_url,
                icon_id: icon.icon_id,
            })));
        } catch (err) {
            console.error('Stickers fetch error:', err);
        }
        setStickersLoading(false);
    };

    const obsServiceInstance = useAppStore(state => state.obsServiceInstance);
    const currentProgramScene = useAppStore(state => state.currentProgramScene);
    const isConnected = useAppStore(state => state.isConnected);
    const accentColorName = useAppStore(state => state.userSettings.theme.accent);


    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const ITEMS_PER_PAGE = 12;

    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

    const toggleCard = (key: keyof typeof openCards) => {
        setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
    };


    // --- GIF Search Handler (Giphy & Tenor) ---
    const handleGifSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gifQuery.trim()) return;
        setGifLoading(true);
        setGifResults([]);
        setGifPage(0);
        setGifSearched(true);
        try {
            if (gifApi === 'giphy') {
                // Always use the latest key
                const gfInstance = new GiphyFetch(getGiphyApiKey());
                const response = await gfInstance.search(gifQuery, { limit: 48, rating: 'g' });
                setGifResults(response.data.map((gif: any) => ({
                    id: gif.id,
                    title: gif.title,
                    images: {
                        fixed_height_small: { url: gif.images.fixed_height_small?.url },
                        original: { url: gif.images.original?.url },
                    },
                    source: 'giphy',
                })));
            } else if (gifApi === 'tenor') {
                const limit = 48;
                const tenorKey = getTenorApiKey();
                const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(gifQuery)}&key=${tenorKey}&limit=${limit}&media_filter=gif&contentfilter=high`;
                const res = await fetch(url);
                const data = await res.json();
                setGifResults((data.results || []).map((item: any) => ({
                    id: item.id,
                    title: item.content_description || '',
                    images: {
                        fixed_height_small: { url: item.media_formats?.tinygif?.url || item.media_formats?.gif?.url },
                        original: { url: item.media_formats?.gif?.url },
                    },
                    source: 'tenor',
                })));
            }
        } catch (err) {
            console.error('GIF search error:', err);
        }
        setGifLoading(false);
    };
    const handleSvgSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!svgQuery.trim()) return;
        setSvgLoading(true);
        setSvgResults([]);
        setSvgPage(0);
        setSvgSearched(true);
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
    };

    const handleEmojiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emojiQuery.trim()) return;
        setEmojiLoading(true);
        setEmojiResults([]);
        setEmojiPage(0);
        setEmojiSearched(true);
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
    };

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
                    { label: 'Add as Image Source', onClick: () => handleAddAsImageSource(data.png_url, data.name || 'sticker'), variant: 'primary' },
                    { label: 'Copy Image URL', onClick: () => { copyToClipboard(data.png_url); showFeedback('Copied image URL!'); } },
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


    const renderCollapsibleCard = (
        cardKey: keyof typeof openCards,
        title: string,
        emoji: string,
        content: React.ReactNode,
        domain?: string,
        customSvg?: string
    ) => (
        <Card className="border-border">
            <button
                onClick={() => toggleCard(cardKey)}
                className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
            >
                <div className="flex items-center space-x-2">
                    {emoji && <span className="emoji text-sm">{emoji}</span>}
                    {domain && <FaviconIcon domain={domain} size={16} />}
                    {customSvg && (
                        <div
                            className="w-4 h-4 text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: customSvg }}
                        />
                    )}
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">{openCards[cardKey] ? 'Hide' : 'Show'}</span>
                    <svg className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", openCards[cardKey] ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            {openCards[cardKey] && <CardContent className="px-3 pb-3">{content}</CardContent>}
        </Card>
    );

    return (
        <div className="space-y-3 max-w-4xl mx-auto p-1">
            {feedbackMessage && <div className="fixed bottom-4 right-4 bg-success text-success-foreground p-3 rounded-lg shadow-lg z-50">{feedbackMessage}</div>}

            {renderCollapsibleCard('html', 'HTML Templates', '📄', (
                <HtmlTemplateBuilder accentColorName={accentColorName} />
            ))}

            {renderCollapsibleCard('giphy', 'GIFs', '', (
                <div>
                    <form onSubmit={handleGifSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={gifQuery} onChange={(e) => setGifQuery(e.target.value)} placeholder="Search for GIFs..." className="input flex-grow" />
                        <FaviconDropdown
                            options={GIF_APIS}
                            value={gifApi}
                            onChange={setGifApi}
                            className="min-w-[140px]"
                        />
                        <Button type="submit" disabled={gifLoading || !gifQuery.trim()}>{gifLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {gifLoading && <div className="text-center">Loading...</div>}
                    {!gifLoading && gifSearched && gifResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {getPaginatedItems(gifResults, gifPage).map((gif) => (
                            <div key={gif.id} className="relative group cursor-pointer bg-slate-800 rounded-md overflow-hidden" onClick={() => setModalContent({ type: 'gif', data: gif })}>
                                <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-32 object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-center text-xs p-1">{gif.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {getTotalPages(gifResults) > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setGifPage(gifPage - 1)} disabled={gifPage === 0}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {gifPage + 1} of {getTotalPages(gifResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setGifPage(gifPage + 1)} disabled={gifPage >= getTotalPages(gifResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ), GIF_APIS.find(a => a.value === gifApi)?.domain)}

            {renderCollapsibleCard('svg', 'SVG Icons', '', (
                <div>
                    <form onSubmit={handleSvgSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={svgQuery} onChange={(e) => setSvgQuery(e.target.value)} placeholder="Search for SVG icons..." className="input flex-grow" />
                        <FaviconDropdown
                            options={SVG_APIS}
                            value={svgApi}
                            onChange={setSvgApi}
                            className="min-w-[140px]"
                        />
                        <Button type="submit" disabled={svgLoading || !svgQuery.trim()}>{svgLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {svgLoading && <div className="text-center">Loading...</div>}
                    {!svgLoading && svgSearched && svgResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-4 gap-2">
                        {getPaginatedItems(svgResults, svgPage).map((result) => (
                            <div key={result.name} className="relative group cursor-pointer p-2 bg-slate-800 rounded-md flex items-center justify-center aspect-square" onClick={() => setModalContent({ type: 'svg', data: result })}>
                                <div className="w-full h-full svg-container" dangerouslySetInnerHTML={{ __html: result.svg }} />
                            </div>
                        ))}
                    </div>
                    {getTotalPages(svgResults) > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setSvgPage(svgPage - 1)} disabled={svgPage === 0}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {svgPage + 1} of {getTotalPages(svgResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setSvgPage(svgPage + 1)} disabled={svgPage >= getTotalPages(svgResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ), undefined, randomHeaderSvg)}

            {renderCollapsibleCard('emoji', 'Emojis', randomHeaderEmoji, (
                <div>
                    <form onSubmit={handleEmojiSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="Search for emojis..." className="input flex-grow" />
                        <FaviconDropdown
                            options={EMOJI_APIS}
                            value={emojiApi}
                            onChange={setEmojiApi}
                            className="min-w-[160px]"
                        />
                        <Button type="submit" disabled={emojiLoading || !emojiQuery.trim()}>{emojiLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {emojiLoading && <div className="text-center">Loading...</div>}
                    {!emojiLoading && emojiSearched && emojiResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {getPaginatedItems(emojiResults, emojiPage).map((emoji, index) => (
                            <div key={`${emoji.slug}-${index}`} className="relative group cursor-pointer p-2 bg-slate-800 rounded-md flex items-center justify-center aspect-square text-5xl sm:text-6xl md:text-7xl" onClick={() => setModalContent({ type: 'emoji', data: emoji })}>
                                {getEmojiChar(emoji)}
                            </div>
                        ))}
                    </div>
                    {getTotalPages(emojiResults) > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setEmojiPage(emojiPage - 1)} disabled={emojiPage === 0}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {emojiPage + 1} of {getTotalPages(emojiResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setEmojiPage(emojiPage + 1)} disabled={emojiPage >= getTotalPages(emojiResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ))}

            {/*
            {renderCollapsibleCard('stickers', 'Stickers', '✨', (
                <div>
                    <form onSubmit={handleStickersSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={stickersQuery} onChange={(e) => setStickersQuery(e.target.value)} placeholder="Search for stickers..." className="input flex-grow" />
                        <Button type="submit" disabled={stickersLoading || !stickersQuery.trim()}>{stickersLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {stickersLoading && <div className="text-center">Loading...</div>}
                    {!stickersLoading && stickersSearched && stickersResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-4 gap-2">
                        {getPaginatedItems(stickersResults, stickersPage).map((result) => (
                            <div key={result.icon_id} className="relative group cursor-pointer p-2 bg-slate-800 rounded-md flex items-center justify-center aspect-square" onClick={() => setModalContent({ type: 'sticker', data: result })}>
                                <img
                                    src={result.png_url}
                                    alt={result.name}
                                    className="max-w-full max-h-full object-contain"
                                    onError={e => {
                                        if (e.currentTarget.src && !e.currentTarget.src.endsWith('/broken-image.png')) {
                                            e.currentTarget.src = '/broken-image.png';
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {getTotalPages(stickersResults) > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setStickersPage(stickersPage - 1)} disabled={stickersPage === 0}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {stickersPage + 1} of {getTotalPages(stickersResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setStickersPage(stickersPage + 1)} disabled={stickersPage >= getTotalPages(stickersResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ))}
            */}
            {renderCollapsibleCard('backgrounds', 'Backgrounds', '🖼️', (
                <div>
                    <form onSubmit={handleBackgroundSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={backgroundQuery} onChange={(e) => setBackgroundQuery(e.target.value)} placeholder="Search for backgrounds..." className="input flex-grow" />
                        <FaviconDropdown
                            options={BACKGROUND_APIS}
                            value={backgroundApi}
                            onChange={setBackgroundApi}
                            className="min-w-[140px]"
                        />
                        <Button type="submit" disabled={backgroundLoading || !backgroundQuery.trim()}>{backgroundLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {backgroundLoading && <div className="text-center">Loading...</div>}
                    {!backgroundLoading && backgroundSearched && backgroundResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {getPaginatedItems(backgroundResults, backgroundPage).map((bg) => (
                            <div key={bg.id} className="relative group cursor-pointer bg-slate-800 rounded-md overflow-hidden" onClick={() => setModalContent({ type: 'background', data: { ...bg, preview: bg.thumbs?.large || bg.thumbs?.original, full: bg.path } })}>
                                <img src={bg.thumbs?.large || bg.thumbs?.original || bg.path} alt={bg.id} className="w-full h-32 object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-center text-xs p-1">{bg.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {getTotalPages(backgroundResults) > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage(backgroundPage - 1)} disabled={backgroundPage === 0}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {backgroundPage + 1} of {getTotalPages(backgroundResults)}</span>
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
                    {modalContent.type === 'svg' && <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto"><div className="w-full h-full svg-modal-container" dangerouslySetInnerHTML={{ __html: modalContent.data.svg }} /></div>}
                    {modalContent.type === 'emoji' && <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto"><div className="text-[12rem] leading-none">{getEmojiChar(modalContent.data)}</div></div>}
                    {modalContent.type === 'background' && <img src={modalContent.data.preview || modalContent.data.full} alt={modalContent.data.id} className="max-w-full max-h-[70vh] mx-auto" />}
                    {modalContent.type === 'sticker' && (
                        <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto">
                            <img
                                src={modalContent.data.png_url}
                                alt={modalContent.data.name}
                                className="max-w-full max-h-full object-contain"
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
}
