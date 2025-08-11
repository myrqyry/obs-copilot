import React, { useState, useMemo, useEffect } from 'react';
import useConnectionsStore from '@/store/connectionsStore';
import { useSettingsStore, SettingsState } from '@/store/settingsStore';
import { toast } from '@/components/ui/toast';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { copyToClipboard } from '@/utils/persistence';
import { CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FaviconDropdown } from '@/components/common/FaviconDropdown';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { getProxiedImageUrl } from '@/utils/imageProxy';
import { catppuccinAccentColorsHexMap } from '@/types';
import { useGenericApiSearch } from '@/hooks/useGenericApiSearch';
import { apiConfigs } from '@/config/apis';
import { apiMappers } from '@/config/api-mappers';
import { safeHostname } from '@/utils/utils';

const BACKGROUND_APIS = Object.keys(apiConfigs).map(key => ({
    value: key,
    label: apiConfigs[key as keyof typeof apiConfigs].label,
    domain: safeHostname(apiConfigs[key as keyof typeof apiConfigs].baseUrl),
    icon: '🖼️', // Default icon, can be customized
}));

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const ITEMS_PER_PAGE = 20;

const BackgroundSearch: React.FC = () => {
    const [backgroundApi, setBackgroundApi] = useState('wallhaven');
    const [backgroundQuery, setBackgroundQuery] = useState('');
    const [modalContent, setModalContent] = useState<{ type: 'background', data: any } | null>(null);

    const obsServiceInstance = useConnectionsStore((state) => state.obsServiceInstance);
    const isConnected = useConnectionsStore((state) => state.isConnected);
    const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);
    const accentColorName = useSettingsStore((state: SettingsState) => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    useEffect(() => {
      setBackgroundPage(0);
    }, [backgroundApi]);

    const {
        results: backgroundResults,
        loading: backgroundLoading,
        page: backgroundPage,
        setPage: setBackgroundPage,
        search,
    } = useGenericApiSearch(backgroundApi as keyof typeof apiConfigs);

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
            const finalName = generateSourceName(
                sourceName?.trim() ? `[BG] ${sourceName}` : '[BG] Image'
            );
            await obsServiceInstance.addBrowserSource(currentProgramScene, url, finalName);
            toast({ title: 'Success', description: `Added "${finalName}" to OBS.` });
        } catch (err) {
            const description = err instanceof Error ? err.message : String(err);
            toast({ title: 'Failed to add source', description, variant: 'destructive' });
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
        const mapper = apiMappers[backgroundApi];
        return mapper ? backgroundResults.map(mapper) : [];
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBackgroundQuery(e.target.value)}
                            placeholder="Search for backgrounds..."
                            className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <FaviconDropdown
                            options={BACKGROUND_APIS}
                            value={backgroundApi}
                            onChange={setBackgroundApi}
                            className="min-w-[100px]"
                        />
                        <Button type="submit" disabled={backgroundLoading || !backgroundQuery.trim()} size="sm">
                          {backgroundLoading ? 'Searching...' : 'Search'}
                        </Button>
                    </form>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 mt-2">
                      {getPaginatedItems(mappedResults, backgroundPage).map((bg) => {
                        const imageUrl = getProxiedImageUrl(bg.thumbnail);
                        return (
                          <button
                            key={bg.id}
                            type="button"
                            aria-label={`Open background "${bg.title || bg.id}"`}
                            className="relative group cursor-pointer bg-slate-800 rounded-md overflow-hidden text-left"
                            onClick={() => setModalContent({ type: 'background', data: bg })}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={bg.title || bg.id || 'Background thumbnail'}
                                className="w-full h-16 object-cover"
                              />
                            ) : (
                              <div className="w-full h-16 bg-slate-900" aria-hidden="true" />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-center text-xs p-0.5">{bg.title}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {getTotalPages(mappedResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage((prev: number) => prev - 1)} disabled={backgroundPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {backgroundPage + 1} of {getTotalPages(mappedResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setBackgroundPage((prev: number) => prev + 1)} disabled={backgroundPage >= getTotalPages(mappedResults) - 1}>Next</Button>
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
