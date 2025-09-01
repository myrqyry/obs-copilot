// src/features/asset-search/AssetSearch.tsx
import React, { useState, useMemo } from 'react';
import { useGenericApiSearch } from '@/hooks/useGenericApiSearch';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { CardContent } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { FaviconDropdown } from '@/components/common/FaviconDropdown';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/common/TextInput';
import { StandardApiItem } from '@/types/api';
import { apiConfigs as registeredApis } from '@/config/apis';
import { handleAppError, createToastError } from '@/lib/errorUtils'; // Import error utilities
import { toast } from '@/components/ui/toast'; // Import toast
import { copyToClipboard } from '@/utils/persistence'; // Import copyToClipboard
import { generateSourceName } from '@/utils/obsSourceHelpers'; // Import generateSourceName
import { useConnectionManagerStore } from '@/store/connectionManagerStore'; // Import useConnectionManagerStore
import { ObsClientImpl as ObsClient } from '@/services/obsClient'; // Import ObsClientImpl

// Define the shape of the API configurations we'll pass in
interface ApiConfig {
    value: string;
    label: string;
    domain: string;
}

// Narrowed service name type based on registered APIs
type ApiServiceName = keyof typeof registeredApis;

// Define the props for our new reusable component
interface AssetSearchProps {
    title: string;
    emoji: string;
    apiConfigs: ApiConfig[];
    // The mapper standardizes external API items into our StandardApiItem
    apiMapper: (item: unknown) => StandardApiItem;
    renderGridItem: (item: StandardApiItem, onClick: () => void) => React.ReactNode;
    renderModalContent: (item: StandardApiItem) => React.ReactNode;
    getModalActions: (item: StandardApiItem) => any[];
    extraSearchParams?: Record<string, any>; // New prop for extra search parameters
    onApiChange?: (api: string) => void; // New prop for handling API changes
}

export const AssetSearch: React.FC<AssetSearchProps> = ({
    title,
    emoji,
    apiConfigs,
    apiMapper,
    renderGridItem,
    renderModalContent,
    getModalActions,
    extraSearchParams = {}, // Default to empty object
    onApiChange, // Destructure onApiChange here
}) => {
    // Determine initial selected API — prefer provided config if it matches the registry,
    // otherwise fall back to the first registered API key.
    const initialSelectedApi = (() => {
        const candidate = apiConfigs?.[0]?.value;
        if (candidate && candidate in registeredApis) {
            return candidate as ApiServiceName;
        }
        return Object.keys(registeredApis)[0] as ApiServiceName;
    })();

    const [selectedApi, setSelectedApi] = useState<ApiServiceName>(initialSelectedApi);
    const [query, setQuery] = useState('');
    const [modalContent, setModalContent] = useState<StandardApiItem | null>(null);

    const { results, loading, searched, search } = useGenericApiSearch(selectedApi);
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore(); // Get state directly from hook

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        search(query, extraSearchParams); // Pass extraSearchParams here
    };

    const handleAddAsBrowserSource = async (url: string, title: string) => {
        if (!isConnected || !obsServiceInstance) {
            toast(createToastError('Not Connected', 'Please connect to OBS first'));
            return;
        }
        try {
            const sourceName = generateSourceName(title);
            await (obsServiceInstance as ObsClient).addBrowserSource(currentProgramScene, url, sourceName, 640, 360);
            toast({ title: 'Success', description: `Added "${title}" as browser source` });
        } catch (error: any) {
            toast(createToastError('Failed to Add Source', handleAppError('Adding browser source', error)));
        }
    };

    const handleAddAsImageSource = async (url: string, title: string) => {
        if (!isConnected || !obsServiceInstance) {
            toast(createToastError('Not Connected', 'Please connect to OBS first'));
            return;
        }
        try {
            const sourceName = generateSourceName(title);
            await (obsServiceInstance as ObsClient).addImageSource(currentProgramScene, url, sourceName);
            toast({ title: 'Success', description: `Added "${title}" as image source` });
        } catch (error: any) {
            toast(createToastError('Failed to Add Source', handleAppError('Adding image source', error)));
        }
    };

    const getCommonModalActions = (item: StandardApiItem): {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    }[] => {
        return [
            {
                label: 'Add as Browser Source',
                onClick: () => handleAddAsBrowserSource(item.url, item.title),
                variant: 'primary'
            },
            {
                label: 'Add as Image Source',
                onClick: () => handleAddAsImageSource(item.url, item.title),
                variant: 'secondary'
            },
            {
                label: 'Copy URL',
                onClick: () => {
                    copyToClipboard(item.url);
                    toast({ title: 'Copied', description: 'URL copied to clipboard' });
                },
                variant: 'secondary'
            }
        ];
    };

    const mappedResults = useMemo<StandardApiItem[]>(() => {
        if (!results) return [];
        return results.map((r) => apiMapper(r));
    }, [results, apiMapper]);

    return (
        <CollapsibleCard title={title} emoji={emoji} isOpen={true} onToggle={() => {}}>
            <CardContent className="px-3 pb-3 pt-2">
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-2">
                    <TextInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search for ${title}...`}
                        className="flex-grow"
                    />
                    <FaviconDropdown
                        options={apiConfigs}
                        value={selectedApi}
                        // Validate the value coming from the dropdown before setting state
                        onChange={(v: string) => {
                            if (v in registeredApis) {
                                setSelectedApi(v as ApiServiceName);
                                // Call onApiChange if provided
                                if (onApiChange) {
                                    onApiChange(v);
                                }
                            }
                        }}
                        className="min-w-[120px]"
                    />
                    <Button type="submit" disabled={loading || !query.trim()} size="sm">
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </form>

                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <LoadingSpinner />
                    </div>
                )}

                {!loading && searched && mappedResults.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No results found.</div>
                )}

                {mappedResults.length > 0 && (
                    <div className="grid grid-cols-4 grid-rows-3 gap-2 h-48">
                        {mappedResults.slice(0, 12).map((item: StandardApiItem) =>
                            renderGridItem(item, () => setModalContent(item)),
                        )}
                    </div>
                )}

                {modalContent && (
                    <Modal
                        isOpen={!!modalContent}
                        onClose={() => setModalContent(null)}
                        title={modalContent.title || 'Asset Preview'}
                        actions={getModalActions(modalContent) || getCommonModalActions(modalContent)}
                    >
                        {renderModalContent(modalContent)}
                    </Modal>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default AssetSearch;
