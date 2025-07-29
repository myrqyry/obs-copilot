import React, { useState, useCallback, useMemo } from 'react';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
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
import { catppuccinAccentColorsHexMap } from '../types';

const SVG_APIS = [
    { value: 'iconfinder', label: 'Iconfinder', domain: 'iconfinder.com', icon: '🎨' },
    { value: 'iconify', label: 'Iconify', domain: 'iconify.design', icon: '🔧' },
    { value: 'feather', label: 'Feather Icons', domain: 'feathericons.com', icon: '🪶' },
    { value: 'heroicons', label: 'Heroicons', domain: 'heroicons.com', icon: '🦸' },
    { value: 'lucide', label: 'Lucide', domain: 'lucide.dev', icon: '💡' },
    { value: 'tabler', label: 'Tabler Icons', domain: 'tabler-icons.io', icon: '📊' },
    { value: 'bootstrap', label: 'Bootstrap Icons', domain: 'icons.getbootstrap.com', icon: '🚀' },
    { value: 'fontawesome', label: 'Font Awesome', domain: 'fontawesome.com', icon: '⭐' }
];

type SvgResult = { name: string; svg: string };

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const SvgSearch: React.FC = () => {
    const [svgQuery, setSvgQuery] = useState('');
    const [svgApi, setSvgApi] = useState('iconify');
    const [svgResults, setSvgResults] = useState<SvgResult[]>([]);
    const [svgLoading, setSvgLoading] = useState(false);
    const [svgPage, setSvgPage] = useState(0);
    const [svgSearched, setSvgSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ type: 'svg', data: any } | null>(null);

    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();
    const { toast } = useToast();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const ITEMS_PER_PAGE = 16;

    const handleAddSvgAsBrowserSource = async (svg: string, sourceName: string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            toast({
                title: 'OBS Not Connected',
                description: 'Please connect to OBS to add sources.',
                variant: 'destructive',
            });
            return;
        }
        try {
            await obsServiceInstance.addSvgAsBrowserSource(currentProgramScene, svg, generateSourceName(sourceName));
            toast({ title: 'Success', description: `Added ${sourceName} to OBS.` });
        } catch (err: any) {
            toast({
                title: 'Failed to add source',
                description: err.message,
                variant: 'destructive',
            });
        }
    };

    const getModalActions = (type: 'svg', data: any): ModalAction[] => {
        return [
            { label: 'Add as Browser Source', onClick: () => handleAddSvgAsBrowserSource(data.svg, data.name), variant: 'primary' },
            { label: 'Copy SVG Code', onClick: () => { copyToClipboard(data.svg); toast({ title: 'Info', description: 'Copied SVG code!' }); } },
        ];
    };

    const handleSvgSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!svgQuery.trim()) return;

        setSvgLoading(true);
        setSvgResults([]);
        setSvgSearched(true);
        setSearchError(null);
        setSvgPage(0);

        try {
            const limit = 48;
            if (svgApi === 'iconfinder') {
                const iconfinderKeyOverride = useApiKeyStore.getState().getApiKeyOverride(ApiService.ICONFINDER);
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const apiUrlPath = isLocal ? '/api/iconfinder' : '/.netlify/functions/proxy?api=iconfinder';
                const params = new URLSearchParams({
                    query: svgQuery,
                    count: String(limit),
                });
                const requestUrl = isLocal ? `/api/iconfinder?${params.toString()}` : `/.netlify/functions/proxy/api/iconfinder?${params.toString()}`;

                const headers: HeadersInit = {};
                if (iconfinderKeyOverride) {
                    headers['X-Api-Key'] = iconfinderKeyOverride;
                }

                const res = await fetch(requestUrl, { headers });
                if (!res.ok) {
                     const errorText = await res.text();
                        throw new Error(`${svgApi} API error: ${res.status} ${res.statusText}. ${errorText}`);
                }
                const data = await res.json();
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
        } catch (err: any) {
            console.error('SVG fetch error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            toast({
                title: 'Error fetching SVGs',
                description: errorMessage,
                variant: 'destructive',
            });
        }
        setSvgLoading(false);
    }, [svgApi, svgQuery, obsServiceInstance, isConnected, currentProgramScene, toast]);

    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

    return (
        <CollapsibleCard
            title="SVG Icons"
            emoji="🎨"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div>
                    <form onSubmit={handleSvgSearch} className="flex items-center gap-1 mb-0.5">
                        <input
                            type="text"
                            value={svgQuery}
                            onChange={(e) => setSvgQuery(e.target.value)}
                            placeholder="Search for SVG icons..."
                            className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <FaviconDropdown
                            options={SVG_APIS}
                            value={svgApi}
                            onChange={setSvgApi}
                            className="min-w-[100px]"
                            accentColor={accentColor}
                        />
                        <Button type="submit" disabled={svgLoading || !svgQuery.trim()} size="sm">{svgLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {svgLoading && <div className="text-center text-xs">Loading...</div>}
                    {!svgLoading && svgSearched && svgResults.length === 0 && <div className="text-center text-muted-foreground text-xs">No results found.</div>}
                    <div className="grid grid-cols-4 gap-1">
                        {getPaginatedItems(svgResults, svgPage).map((result) => (
                            <div key={result.name} className="relative group cursor-pointer p-1 bg-slate-800 rounded-md flex items-center justify-center aspect-square" onClick={() => setModalContent({ type: 'svg', data: result })}>
                                <div className="w-full h-full svg-container" dangerouslySetInnerHTML={{ __html: result.svg }} />
                            </div>
                        ))}
                    </div>
                    {getTotalPages(svgResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setSvgPage(svgPage - 1)} disabled={svgPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {svgPage + 1} of {getTotalPages(svgResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setSvgPage(svgPage + 1)} disabled={svgPage >= getTotalPages(svgResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            </CardContent>
            {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title={modalContent.data.name}
                    actions={getModalActions(modalContent.type, modalContent.data)}
                >
                    <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto"><div className="w-full h-full flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" dangerouslySetInnerHTML={{ __html: modalContent.data.svg }} /></div>
                </Modal>
            )}
        </CollapsibleCard>
    );
};

export default SvgSearch;
