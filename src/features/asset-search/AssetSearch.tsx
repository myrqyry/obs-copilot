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
import { safeHostname } from '@/utils/utils';

// Define the shape of the API configurations we'll pass in
interface ApiConfig {
    value: string;
    label: string;
    domain: string;
}

// Define the props for our new reusable component
interface AssetSearchProps {
    title: string;
    emoji: string;
    apiConfigs: ApiConfig[];
    apiMapper: (item: any) => any; // Function to standardize API results
    renderGridItem: (item: any, onClick: () => void) => React.ReactNode;
    renderModalContent: (item: any) => React.ReactNode;
    getModalActions: (item: any) => any[];
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
    const [selectedApi, setSelectedApi] = useState(apiConfigs[0]?.value || '');
    const [query, setQuery] = useState('');
    const [modalContent, setModalContent] = useState<any | null>(null);

    const { results, loading, searched, search } = useGenericApiSearch(selectedApi);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        search(query);
    };

    const mappedResults = useMemo(() => {
        if (!results || !results.results) return [];
        return results.results.map(apiMapper);
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
                        onChange={setSelectedApi}
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
                        {mappedResults.slice(0, 12).map((item) => renderGridItem(item, () => setModalContent(item)))}
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