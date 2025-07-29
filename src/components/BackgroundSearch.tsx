import React, { useState, useCallback, useMemo } from 'react';
import useApiKeyStore, { ApiService, ApiServiceName } from '../store/apiKeyStore';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useToast } from './ui/use-toast';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import { Modal } from './common/Modal';
import { Button } from './ui/Button';
import { FaviconIcon } from './common/FaviconIcon';
import Tooltip from './ui/Tooltip';
import { FaviconDropdown } from './common/FaviconDropdown';
import { CollapsibleCard } from './common/CollapsibleCard';
import { TextInput } from './common/TextInput';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { unsplashService, UnsplashPhoto } from '../services/unsplashService';
import { catppuccinAccentColorsHexMap } from '../types';

const BACKGROUND_APIS = [
    { value: 'wallhaven', label: 'Wallhaven', domain: 'wallhaven.cc', icon: '🖼️' },
    { value: 'unsplash', label: 'Unsplash', domain: 'unsplash.com', icon: '📸' },
    { value: 'pexels', label: 'Pexels', domain: 'pexels.com', icon: '🎨' },
    { value: 'pixabay', label: 'Pixabay', domain: 'pixabay.com', icon: '🖼️' },
    { value: 'deviantart', label: 'DeviantArt', domain: 'deviantart.com', icon: '🎨' },
    { value: 'artstation', label: 'ArtStation', domain: 'artstation.com', icon: '🎬' }
];

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const getEffectiveApiKey = (serviceName: ApiServiceName): string | undefined => {
    const override = useApiKeyStore.getState().getApiKeyOverride(serviceName);
    if (override) return override;

    switch (serviceName) {
        case ApiService.GEMINI: return import.meta.env.VITE_GEMINI_API_KEY;
        case ApiService.PEXELS: return import.meta.env.VITE_PEXELS_API_KEY;
        case ApiService.PIXABAY: return import.meta.env.VITE_PIXABAY_API_KEY;
        case ApiService.DEVIANTART: return import.meta.env.VITE_DEVIANTART_API_KEY;
        case ApiService.IMGFLIP: return import.meta.env.VITE_IMGFLIP_API_KEY;
        case ApiService.IMGUR: return import.meta.env.VITE_IMGUR_API_KEY;
        case ApiService.ICONFINDER: return import.meta.env.VITE_ICONFINDER_API_KEY;
        case ApiService.GIPHY: return import.meta.env.VITE_GIPHY_API_KEY;
        case ApiService.CHUTES: return import.meta.env.VITE_CHUTES_API_KEY;
        case ApiService.TENOR: return import.meta.env.VITE_TENOR_API_KEY;
        case ApiService.WALLHAVEN: return import.meta.env.VITE_WALLHAVEN_API_KEY;
        case ApiService.OPENEMOJI: return import.meta.env.VITE_OPENEMOJI_API_KEY;
        case ApiService.UNSPLASH: return import.meta.env.VITE_UNSPLASH_API_KEY;
        default: return undefined;
    }
};

const getUnsplashApiKey = () => getEffectiveApiKey(ApiService.UNSPLASH);
const getPexelsApiKey = () => getEffectiveApiKey(ApiService.PEXELS);
const getPixabayApiKey = () => getEffectiveApiKey(ApiService.PIXABAY);
const getDeviantArtApiKey = () => getEffectiveApiKey(ApiService.DEVIANTART);

const BackgroundSearch: React.FC = () => {
    const [backgroundApi, setBackgroundApi] = useState('wallhaven');
    const [backgroundQuery, setBackgroundQuery] = useState('');
    const [backgroundResults, setBackgroundResults] = useState<any[]>([]);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [backgroundPage, setBackgroundPage] = useState(0);
    const [backgroundSearched, setBackgroundSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ type: 'background', data: any } | null>(null);

    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();
    const { toast } = useToast(); // Removed 'error' from destructuring
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const ITEMS_PER_PAGE = 16;

    const handleAddAsBrowserSource = async (url: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            toast({
                title: 'OBS Not Connected',
                description: 'Please connect to OBS to add sources.',
                variant: 'destructive',
            });
            return;
        }
        try {
            await obsServiceInstance.addBrowserSource(currentProgramScene, url, generateSourceName(sourceName));
            toast({ title: 'Success', description: `Added ${sourceName} to OBS.` });
        } catch (err: any) {
            toast({
                title: 'Failed to add source',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    const getModalActions = (type: 'background', data: any): ModalAction[] => {
        return [
            { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.path, data.id || 'background'), variant: 'primary' },
            { label: 'Copy Image URL', onClick: () => { copyToClipboard(data.path); toast({ title: 'Info', description: 'Copied image URL!' }); } },
        ];
    };

    const handleBackgroundSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!backgroundQuery.trim()) return;

        setBackgroundLoading(true);
        setBackgroundResults([]);
        setBackgroundSearched(true);
        setSearchError(null);
        setBackgroundPage(0);

        try {
            if (backgroundApi === 'wallhaven') {
                const apiUrlPath = '/api/wallhaven';
                const params = new URLSearchParams({
                    q: backgroundQuery,
                    categories: '111',
                    purity: '100',
                    sorting: 'relevance',
                    order: 'desc',
                    page: '1',
                });
                const requestUrl = `${apiUrlPath}?${params.toString()}`;
                const res = await fetch(requestUrl);
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Wallhaven API error: ${res.status} ${res.statusText}. ${errorText}`);
                }
                const data = await res.json();
                setBackgroundResults(data.data.slice(0, 48));
            } else if (backgroundApi === 'unsplash') {
                const unsplashKey = getUnsplashApiKey();
                if (!unsplashKey) {
                    toast({
                        title: 'Unsplash API Key Missing',
                        description: 'Please provide an Unsplash API key to use this service.',
                        variant: 'destructive',
                    });
                    return;
                }
                const result = await unsplashService.searchPhotos(backgroundQuery, {
                    perPage: 30,
                    orientation: 'landscape',
                    orderBy: 'relevant'
                });
                setBackgroundResults(result.results.map((item: UnsplashPhoto) => ({
                    id: item.id,
                    title: item.description || item.alt_description || '',
                    url: unsplashService.getPhotoUrl(item, 'regular'),
                    thumbnail: unsplashService.getPhotoUrl(item, 'small'),
                    source: 'unsplash',
                    author: item.user?.name || 'Unknown',
                    attribution: unsplashService.getPhotoAttribution(item),
                    downloadLocation: item.links.download_location,
                    originalPhoto: item
                })));
            } else if (backgroundApi === 'pexels') {
                const pexelsKey = getPexelsApiKey();
                if (!pexelsKey) {
                    toast({
                        title: 'Pexels API Key Missing',
                        description: 'Please provide a Pexels API key to use this service.',
                        variant: 'destructive',
                    });
                    return;
                }
                const params = new URLSearchParams({
                    query: backgroundQuery,
                    per_page: '30',
                    orientation: 'landscape',
                });
                const requestUrl = `/api/pexels?${params.toString()}`;
                const res = await fetch(requestUrl, { headers: { 'X-Api-Key': pexelsKey } });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Pexels API error: ${res.status} ${res.statusText}. ${errorText}`);
                }
                const data = await res.json();
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
                if (!pixabayKey) {
                    toast({
                        title: 'Pixabay API Key Missing',
                        description: 'Please provide a Pixabay API key to use this service.',
                        variant: 'destructive',
                    });
                    return;
                }
                const params = new URLSearchParams({
                    q: backgroundQuery,
                    image_type: 'photo',
                    orientation: 'horizontal',
                    per_page: '30',
                });
                const requestUrl = `/api/pixabay?${params.toString()}`;
                const res = await fetch(requestUrl, { headers: { 'X-Api-Key': pixabayKey } });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Pixabay API error: ${res.status} ${res.statusText}. ${errorText}`);
                }
                const data = await res.json();
                setBackgroundResults(data.hits?.map((item: any) => ({
                    id: item.id,
                    title: item.tags || '',
                    url: item.largeImageURL,
                    thumbnail: item.webformatURL,
                    source: 'pixabay',
                    author: item.user || 'Unknown'
                })) || []);
            } else if (backgroundApi === 'deviantart') {
                const deviantArtKey = getDeviantArtApiKey();
                if (!deviantArtKey) {
                    toast({
                        title: 'DeviantArt API Key Missing',
                        description: 'Please provide a DeviantArt API key to use this service.',
                        variant: 'destructive',
                    });
                    return;
                }
                const params = new URLSearchParams({
                    q: backgroundQuery,
                    limit: '30',
                    mature_content: 'false',
                });
                const requestUrl = `/api/deviantart?${params.toString()}`;
                const res = await fetch(requestUrl, { headers: { 'X-Api-Key': deviantArtKey } });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`DeviantArt API error: ${res.status} ${res.statusText}. ${errorText}`);
                }
                const data = await res.json();
                setBackgroundResults(data.results?.map((item: any) => ({
                    id: item.deviationid,
                    title: item.title || '',
                    url: item.preview?.src || item.thumbs?.[0]?.src || '',
                    thumbnail: item.thumbs?.[0]?.src || '',
                    source: 'deviantart',
                    author: item.author?.username || 'Unknown'
                })) || []);
            } else if (backgroundApi === 'artstation') {
                const requestUrl = `/api/artstation?q=${encodeURIComponent(backgroundQuery)}&page=1&per_page=30`;
                const res = await fetch(requestUrl);
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`ArtStation API error: ${res.status} ${res.statusText}. ${errorText}`);
                }
                const data = await res.json();
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
        } catch (err: any) {
            console.error('Backgrounds fetch error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            toast({
                title: 'Error fetching backgrounds',
                description: errorMessage,
                variant: 'destructive',
            });
        }
        setBackgroundLoading(false);
    }, [backgroundApi, backgroundQuery, obsServiceInstance, currentProgramScene, isConnected, toast]);

    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

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

    return (
        <CollapsibleCard
            title="Backgrounds"
            emoji="🖼️"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
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
            </CardContent>
            {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title={modalContent.data.id}
                    actions={getModalActions(modalContent.type, modalContent.data)}
                >
                    {renderBackgroundModal(modalContent.data)}
                </Modal>
            )}
        </CollapsibleCard>
    );
};

export default BackgroundSearch;
