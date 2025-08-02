import React, { useState, useCallback, useMemo } from 'react';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { useSettingsStore } from '../store/settingsStore';
import { useToast } from './ui/use-toast';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import { Modal } from './common/Modal';
import { Button } from './ui/Button';
import { FaviconDropdown } from './common/FaviconDropdown';
import { CollapsibleCard } from './common/CollapsibleCard';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { catppuccinAccentColorsHexMap } from '../types';
import { useGenericApiSearch } from '../hooks/useGenericApiSearch';
import { apiConfigs } from '../config/apis';

const BACKGROUND_APIS = Object.keys(apiConfigs).map(key => ({
    value: key,
    label: apiConfigs[key as keyof typeof apiConfigs].label,
    domain: new URL(apiConfigs[key as keyof typeof apiConfigs].baseUrl).hostname,
    icon: '🖼️', // Default icon, can be customized
}));

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const BackgroundSearch: React.FC = () => {
    const [backgroundApi, setBackgroundApi] = useState('wallhaven');
    const [backgroundQuery, setBackgroundQuery] = useState('');
    const [modalContent, setModalContent] = useState<{ type: 'background', data: any } | null>(null);

    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();
    const { toast } = useToast();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const {
        results: backgroundResults,
        loading: backgroundLoading,
        searched: backgroundSearched,
        page: backgroundPage,
        setPage: setBackgroundPage,
        search,
    } = useGenericApiSearch(backgroundApi as keyof typeof apiConfigs);

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

    const getModalActions = (data: any): ModalAction[] => {
        return [
            { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.url, data.id || 'background'), variant: 'primary' },
            { label: 'Copy Image URL', onClick: () => { copyToClipboard(data.url); toast({ title: 'Info', description: 'Copied image URL!' }); } },
        ];
    };

    const handleBackgroundSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!backgroundQuery.trim()) return;
        search(backgroundQuery);
    };

    const mappedResults = useMemo(() => {
        if (!backgroundResults) return [];
        switch (backgroundApi) {
            case 'wallhaven':
                return backgroundResults.map((item: any) => ({
                    id: item.id,
                    title: item.id,
                    url: item.path,
                    thumbnail: item.thumbs?.small || item.thumbs?.original,
                    source: 'wallhaven',
                    author: 'Unknown',
                }));
            case 'unsplash':
                 return backgroundResults.map((item: any) => ({
                    id: item.id,
                    title: item.description || item.alt_description || '',
                    url: item.urls.regular,
                    thumbnail: item.urls.thumb,
                    source: 'unsplash',
                    author: item.user?.name || 'Unknown',
                }));
            case 'pexels':
                return backgroundResults.map((item: any) => ({
                    id: item.id,
                    title: item.alt || '',
                    url: item.src.large,
                    thumbnail: item.src.medium,
                    source: 'pexels',
                    author: item.photographer || 'Unknown',
                }));
            case 'pixabay':
                return backgroundResults.map((item: any) => ({
                    id: item.id,
                    title: item.tags || '',
                    url: item.largeImageURL,
                    thumbnail: item.webformatURL,
                    source: 'pixabay',
                    author: item.user || 'Unknown',
                }));
            case 'deviantart':
                return backgroundResults.map((item: any) => ({
                    id: item.deviationid,
                    title: item.title || '',
                    url: item.preview?.src || item.content?.src,
                    thumbnail: item.thumbs?.[0]?.src,
                    source: 'deviantart',
                    author: item.author?.username || 'Unknown',
                }));
            case 'artstation':
                return backgroundResults.map((item: any) => ({
                    id: item.id,
                    title: item.title || '',
                    url: item.cover?.large_image_url || item.cover?.image_url,
                    thumbnail: item.cover?.thumb_url,
                    source: 'artstation',
                    author: item.user?.full_name || 'Unknown',
                }));
            default:
                return [];
        }
    }, [backgroundResults, backgroundApi]);


    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

    const renderBackgroundModal = (data: any) => {
        const imageUrl = getProxiedImageUrl(data.url);
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
                    {!backgroundLoading && backgroundSearched && mappedResults.length === 0 && <div className="text-center text-muted-foreground text-xs">No results found.</div>}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                        {getPaginatedItems(mappedResults, backgroundPage).map((bg) => {
                            const imageUrl = getProxiedImageUrl(bg.thumbnail);
                            return (
                                <div key={bg.id} className="relative group cursor-pointer bg-slate-800 rounded-md overflow-hidden" onClick={() => setModalContent({ type: 'background', data: bg })}>
                                    {imageUrl && (
                                        <img src={imageUrl} alt={bg.id} className="w-full h-16 object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-center text-xs p-0.5">{bg.title}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {getTotalPages(mappedResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage(backgroundPage - 1)} disabled={backgroundPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {backgroundPage + 1} of {getTotalPages(mappedResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage(backgroundPage + 1)} disabled={backgroundPage >= getTotalPages(mappedResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            </CardContent>
            {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title={modalContent.data.title}
                    actions={getModalActions(modalContent.data)}
                >
                    {renderBackgroundModal(modalContent.data)}
                </Modal>
            )}
        </CollapsibleCard>
    );
};

export default BackgroundSearch;
