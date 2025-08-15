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
import axios from 'axios';
import { SearchFilters } from './SearchFilters'; // <-- IMPORT our new component

// --- Configuration ---
const GIF_APIS = [
    { value: 'giphy', label: 'Giphy', domain: 'giphy.com' },
    { value: 'tenor', label: 'Tenor', domain: 'tenor.com' },
];

const GifSearch: React.FC = () => {
    // --- State Management ---
    const [query, setQuery] = useState('');
    const [selectedApi, setSelectedApi] = useState('giphy');
    const [showFilters, setShowFilters] = useState(false);
    // Add all the new filter options to our state
    const [filters, setFilters] = useState({
        rating: 'g',
        limit: 12,
        lang: 'en',
        type: 'gifs', // Giphy-specific
        bundle: 'messaging_non_clips' // Giphy-specific
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);
    const [modalContent, setModalContent] = useState<any | null>(null);
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

    // --- Event Handlers ---
    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        setResults([]);
        try {
            const endpoint = `/api/assets/search/${selectedApi}`;
            const params = new URLSearchParams({ ...filters, query });
            const adminApiKey = import.meta.env.VITE_ADMIN_API_KEY;
            const headers = { 'X-API-KEY': adminApiKey };
            const response = await axios.get(`${endpoint}?${params.toString()}`, { headers });
            const data = response.data.results || response.data.data || [];
            setResults(data);
        } catch (error: any) {
            toast({ title: 'Search Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };
    
    // --- Data Mapping & UI Handlers (No changes needed here) ---
    const mappedResults = useMemo(() => {
        return results.map(item => { /* ... (same mapping logic as before) */ });
    }, [results, selectedApi]);

    const handleAddAsBrowserSource = async (url: string, title: string) => { /* ... */ };
    const getModalActions = (item: any) => { /* ... */ };

    // --- Render Logic ---
    return (
        <CollapsibleCard title="GIF Search" emoji="🎬" isOpen={true} onToggle={() => {}}>
            <CardContent className="px-3 pb-3 pt-2">
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-2">
                    <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for GIFs..." className="flex-grow"/>
                    <FaviconDropdown options={GIF_APIS} value={selectedApi} onChange={setSelectedApi} className="min-w-[120px]"/>
                    <Button type="submit" disabled={loading || !query.trim()} size="sm">{loading ? 'Searching...' : 'Search'}</Button>
                </form>

                <Button variant="link" size="sm" className="px-0 py-1 h-auto -mt-2" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                </Button>

                {showFilters && <SearchFilters filters={filters} onFilterChange={handleFilterChange} api={selectedApi} />}

                {loading && <div className="flex justify-center items-center py-8"><LoadingSpinner /></div>}
                {!loading && searched && mappedResults.length === 0 && <div className="text-center py-4 text-muted-foreground">No results found.</div>}
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
                    <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={modalContent.title || 'GIF Preview'} actions={getModalActions(modalContent)}>
                        <img src={modalContent.url} alt={modalContent.title} className="max-w-full max-h-[70vh] mx-auto rounded" />
                    </Modal>
                )}
            </CardContent>
        </CollapsibleCard>
    );
};

export default GifSearch;