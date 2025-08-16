// src/features/asset-search/AssetSearch.tsx
import React, { useState, useMemo } from 'react';
import { useGenericApiSearch } from '@/hooks/useGenericApiSearch';
import { Button } from '@/components/ui/Button';
import { CardContent } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { FaviconDropdown } from '@/components/common/FaviconDropdown';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/common/TextInput';
import { StandardApiItem } from '@/types/api';
import { apiConfigs as registeredApis } from '@/config/apis';

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
}

export const AssetSearch: React.FC<AssetSearchProps> = ({
    title,
    emoji,
    apiConfigs,
    apiMapper,
    renderGridItem,
    renderModalContent,
    getModalActions,
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        search(query);
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
                        actions={getModalActions(modalContent)}
                    >
                        {renderModalContent(modalContent)}
                    </Modal>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default AssetSearch;