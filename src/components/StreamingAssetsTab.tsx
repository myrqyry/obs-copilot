import { GiphyFetch } from '@giphy/js-fetch-api';
import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { addBrowserSource, addMediaSource, addSvgAsBrowserSource, addEmojiAsBrowserSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { Card, CardContent } from './ui/Card';
import HtmlTemplateBuilder from './HtmlTemplateBuilder';
import { Modal } from './common/Modal';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

const giphyApiKey = import.meta.env.VITE_GIPHY_API_KEY || '';

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const gf = new GiphyFetch(giphyApiKey);

const SVG_APIS = [
    { label: 'Iconify', value: 'iconify', domain: 'iconify.design' },
    { label: 'Material Symbols', value: 'material-symbols', domain: 'fonts.google.com' },
    { label: 'Tabler Icons', value: 'tabler', domain: 'tabler-icons.io' },
];
const EMOJI_APIS = [
    { label: 'EmojiHub API', value: 'emojihub', domain: 'emojihub.yurace.pro' },
    { label: 'Emoji Family API', value: 'emojifamily', domain: 'emojifamily.com' },
    { label: 'Open Emoji API', value: 'openemoji', domain: 'emoji-api.com' },
    { label: 'Unicode Static', value: 'unicode', domain: 'unicode.org' },
];

type SvgResult = { name: string; svg: string };
type EmojiResult = { [key: string]: any };

export default function StreamingAssetsTab() {
    const [openCards, setOpenCards] = useState({
        html: true,
        giphy: false,
        svg: false,
        emoji: false,
    });

    const [giphyQuery, setGiphyQuery] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [giphyLoading, setGiphyLoading] = useState(false);
    const [giphyPage, setGiphyPage] = useState(0);
    const [giphySearched, setGiphySearched] = useState(false);

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

    const [modalContent, setModalContent] = useState<{ type: 'gif' | 'svg' | 'emoji', data: any } | null>(null);

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

    const handleGiphySearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!giphyQuery.trim()) return;
        setGiphyLoading(true);
        setGiphyResults([]);
        setGiphyPage(0);
        setGiphySearched(true);
        try {
            const response = await gf.search(giphyQuery, { limit: 48, rating: 'g' });
            setGiphyResults(response.data.map((gif: any) => ({
                id: gif.id,
                title: gif.title,
                images: {
                    fixed_height_small: { url: gif.images.fixed_height_small?.url },
                    original: { url: gif.images.original?.url },
                }
            })));
        } catch (err) {
            console.error('Giphy search error:', err);
        }
        setGiphyLoading(false);
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

    // const handleAddAsImageSource = async (url: string, sourceName: string) => {
    //     if (!obsServiceInstance || !isConnected || !currentProgramScene) return showFeedback('OBS not connected.');
    //     try {
    //         await addImageSource(obsServiceInstance, currentProgramScene, url, generateSourceName(sourceName));
    //         showFeedback(`Added ${sourceName} to OBS.`);
    //     } catch (error) {
    //         showFeedback('Failed to add source.');
    //     }
    // };

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

    const getModalActions = (type: 'gif' | 'svg' | 'emoji', data: any): ModalAction[] => {
        switch (type) {
            case 'gif':
                return [
                    { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(data.images.original.url, data.title || 'giphy'), variant: 'primary' },
                    { label: 'Add as Media Source', onClick: () => handleAddAsMediaSource(data.images.original.url, data.title || 'giphy'), variant: 'secondary' },
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
            default:
                return [];
        }
    };

    const renderCollapsibleCard = (
        cardKey: keyof typeof openCards,
        title: string,
        emoji: string,
        content: React.ReactNode
    ) => (
        <Card className="border-border">
            <button
                onClick={() => toggleCard(cardKey)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-lg"
            >
                <div className="flex items-center space-x-2">
                    <span className="emoji">{emoji}</span>
                    <span className="text-sm font-medium text-primary">{title}</span>
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

            {renderCollapsibleCard('html', 'HTML Templates', '📄', <HtmlTemplateBuilder accentColorName={accentColorName} />)}

            {renderCollapsibleCard('giphy', 'Giphy GIFs', '🖼️', (
                <div>
                    <form onSubmit={handleGiphySearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={giphyQuery} onChange={(e) => setGiphyQuery(e.target.value)} placeholder="Search for GIFs..." className="input flex-grow" />
                        <Button type="submit" disabled={giphyLoading || !giphyQuery.trim()}>{giphyLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {giphyLoading && <div className="text-center">Loading...</div>}
                    {!giphyLoading && giphySearched && giphyResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {getPaginatedItems(giphyResults, giphyPage).map((gif) => (
                            <div key={gif.id} className="relative group cursor-pointer" onClick={() => setModalContent({ type: 'gif', data: gif })}>
                                <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-32 object-cover rounded-md" />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-center text-xs p-1">{gif.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {getTotalPages(giphyResults) > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button variant="secondary" size="sm" onClick={() => setGiphyPage(giphyPage - 1)} disabled={giphyPage === 0}>Previous</Button>
                            <span className="text-sm text-muted-foreground">Page {giphyPage + 1} of {getTotalPages(giphyResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setGiphyPage(giphyPage + 1)} disabled={giphyPage >= getTotalPages(giphyResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            ))}

            {renderCollapsibleCard('svg', 'SVG Icons', '🎨', (
                <div>
                    <form onSubmit={handleSvgSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={svgQuery} onChange={(e) => setSvgQuery(e.target.value)} placeholder="Search for SVG icons..." className="input flex-grow" />
                        <select value={svgApi} onChange={(e) => setSvgApi(e.target.value)} className="input">
                            {SVG_APIS.map(api => <option key={api.value} value={api.value}>{api.label}</option>)}
                        </select>
                        <Button type="submit" disabled={svgLoading || !svgQuery.trim()}>{svgLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {svgLoading && <div className="text-center">Loading...</div>}
                    {!svgLoading && svgSearched && svgResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {getPaginatedItems(svgResults, svgPage).map((result) => (
                            <div key={result.name} className="relative group cursor-pointer p-2 bg-muted rounded-md flex items-center justify-center" onClick={() => setModalContent({ type: 'svg', data: result })}>
                                <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: result.svg }} />
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
            ))}

            {renderCollapsibleCard('emoji', 'Emojis', '😀', (
                <div>
                    <form onSubmit={handleEmojiSearch} className="flex items-center space-x-2 mb-4">
                        <input type="text" value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="Search for emojis..." className="input flex-grow" />
                        <select value={emojiApi} onChange={(e) => setEmojiApi(e.target.value)} className="input">
                            {EMOJI_APIS.map(api => <option key={api.value} value={api.value}>{api.label}</option>)}
                        </select>
                        <Button type="submit" disabled={emojiLoading || !emojiQuery.trim()}>{emojiLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {emojiLoading && <div className="text-center">Loading...</div>}
                    {!emojiLoading && emojiSearched && emojiResults.length === 0 && <div className="text-center text-muted-foreground">No results found.</div>}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {getPaginatedItems(emojiResults, emojiPage).map((emoji, index) => (
                            <div key={`${emoji.slug}-${index}`} className="relative group cursor-pointer p-2 bg-muted rounded-md flex items-center justify-center text-4xl" onClick={() => setModalContent({ type: 'emoji', data: emoji })}>
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

            {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title={
                        modalContent.type === 'gif' ? modalContent.data.title :
                            modalContent.type === 'svg' ? modalContent.data.name :
                                'Emoji Preview'
                    }
                    actions={getModalActions(modalContent.type, modalContent.data)}
                >
                    {modalContent.type === 'gif' && <img src={modalContent.data.images.original.url} alt={modalContent.data.title} className="max-w-full max-h-[70vh] mx-auto" />}
                    {modalContent.type === 'svg' && <div className="p-4 bg-white rounded-md flex justify-center items-center"><div className="w-64 h-64" dangerouslySetInnerHTML={{ __html: modalContent.data.svg }} /></div>}
                    {modalContent.type === 'emoji' && <div className="p-4 flex justify-center items-center"><div className="text-9xl">{getEmojiChar(modalContent.data)}</div></div>}
                </Modal>
            )}
        </div>
    );
}
