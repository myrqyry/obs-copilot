// src/features/asset-search/GifSearch.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { CardContent } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { FaviconDropdown } from '@/components/common/FaviconDropdown';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/common/TextInput';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { toast } from '@/components/ui/toast';
import { copyToClipboard } from '@/utils/persistence';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import axios from 'axios'; // We'll use axios for our API calls

// --- Configuration (Kept at the top for clarity) ---

const GIF_APIS = [
    { value: 'giphy', label: 'Giphy', domain: 'giphy.com' },
    { value: 'tenor', label: 'Tenor', domain: 'tenor.com' },
];

// --- The Main Component ---

const GifSearch: React.FC = () => {
    // State for the UI
    const [query, setQuery] = useState('');
    const [selectedApi, setSelectedApi] = useState('giphy');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ rating: 'g', limit: 12, lang: 'en' });

    // State for the data
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    // State for the Modal
    const [modalContent, setModalContent] = useState<any | null>(null);

    // OBS Integration
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

    // --- Data Fetching ---

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setResults([]);

        try {
            // This is our simple, clean call to YOUR backend
            const endpoint = `/api/assets/search/${selectedApi}`;
            const params = new URLSearchParams({ ...filters, query });
            const response = await axios.get(`${endpoint}?${params.toString()}`);
            
            // Tenor nests results under 'results', Giphy under 'data'
            const data = response.data.results || response.data.data || [];
            setResults(data);

        } catch (error: any) {
            toast({ title: 'Search Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // --- Data Mapping (Standardizing the results) ---

    const mappedResults = useMemo(() => {
        return results.map(item => {
            if (selectedApi === 'giphy') {
                return {
                    id: item.id,
                    title: item.title || 'Giphy GIF',
                    url: item.images?.original?.url,
                    thumbnail: item.images?.fixed_width_downsampled?.url,
                };
            }
            if (selectedApi === 'tenor') {
                return {
                    id: item.id,
                    title: item.content_description || 'Tenor GIF',
                    url: item.media_formats?.gif?.url,
                    thumbnail: item.media_formats?.tinygif?.url,
                };
            }
            return item;
        });
    }, [results, selectedApi]);

    // --- Handlers for OBS and UI Actions ---

    const handleAddAsBrowserSource = async (url: string, title: string) => {
        if (!isConnected || !currentProgramScene || !obsServiceInstance) {
            toast({ title: 'OBS Not Connected', variant: 'destructive' });
            return;
        }
        const sourceName = generateSourceName(`GIF-${title}`);
        await (obsServiceInstance as any).addBrowserSource(currentProgramScene, url, sourceName);
        toast({ title: 'Success', description: `Added "${sourceName}" to OBS.` });
    };

    const getModalActions = (item: any) => [
        { label: 'Add to OBS', onClick: () => handleAddAsBrowserSource(item.url, item.title), variant: 'primary' },
        { label: 'Copy URL', onClick: () => { copyToClipboard(item.url); toast({ title: 'Copied!' }); } },
    ];
    
    // --- Render Logic ---

    return (
        <CollapsibleCard title="GIF Search" emoji="🎬" isOpen={true} onToggle={() => {}}>
            <CardContent className="px-3 pb-3 pt-2">
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-2">
                    <TextInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for GIFs..."
                        className="flex-grow"
                    />
                    <FaviconDropdown
                        options={GIF_APIS}
                        value={selectedApi}
                        onChange={setSelectedApi}
                        className="min-w-[120px]"
                    />
                    <Button type="submit" disabled={loading || !query.trim()} size="sm">
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </form>

                <Button variant="link" size="sm" className="px-0 py-1 h-auto" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                </Button>

                {showFilters && (
                    <div className="p-2 bg-card border border-border rounded-md mt-2">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground">Rating</label>
                                <select value={filters.rating} onChange={(e) => setFilters(f => ({...f, rating: e.target.value}))} className="w-full text-xs bg-background border border-border rounded px-2 py-1">
                                    <option value="g">G</option>
                                    <option value="pg">PG</option>
                                    <option value="pg-13">PG-13</option>
                                    <option value="r">R</option>
                                </select>
                            </div>
                         </div>
                    </div>
                )}

                {loading && <div className="flex justify-center items-center py-8"><LoadingSpinner /></div>}
                
                {!loading && searched && mappedResults.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No results found.</div>
                )}

                {mappedResults.length > 0 && (
                    <div className="grid grid-cols-4 grid-rows-3 gap-2 h-48 mt-2">
                        {mappedResults.map((item) => (
                            <div key={item.id} className="relative group cursor-pointer h-full" onClick={() => setModalContent(item)}>
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-md" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ))}
                    </div>
                )}

                {modalContent && (
                    <Modal
                        isOpen={!!modalContent}
                        onClose={() => setModalContent(null)}
                        title={modalContent.title || 'GIF Preview'}
                        actions={getModalActions(modalContent)}
                    >
                        <img src={modalContent.url} alt={modalContent.title} className="max-w-full max-h-[70vh] mx-auto rounded" />
                    </Modal>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default GifSearch;