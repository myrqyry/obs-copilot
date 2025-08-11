import React, { useState, useCallback } from 'react';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { useSettingsStore } from '../store/settingsStore';
import { toast } from './ui/toast';
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

const EMOJI_APIS = [
    { value: 'emoji-api', label: 'Emoji API', domain: 'emoji-api.com', icon: '😀' },
    { value: 'emojihub', label: 'EmojiHub', domain: 'emojihub.vercel.app', icon: '🎯' },
    { value: 'emoji-db', label: 'Emoji DB', domain: 'emojidb.com', icon: '🗄️' },
    { value: 'unicode', label: 'Unicode Emoji', domain: 'unicode.org', icon: '🌐' },
    { value: 'openmoji', label: 'OpenMoji', domain: 'openmoji.org', icon: '🎨' },
    { value: 'twemoji', label: 'Twemoji', domain: 'twemoji.twitter.com', icon: '🐦' },
    { value: 'noto', label: 'Noto Emoji', domain: 'fonts.google.com/noto', icon: '📝' }
];

type EmojiResult = { [key: string]: any };

type ModalAction = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
};

const EmojiSearch: React.FC = () => {
    const [emojiQuery, setEmojiQuery] = useState('');
    const [emojiApi, setEmojiApi] = useState('emojihub');
    const [emojiResults, setEmojiResults] = useState<EmojiResult[]>([]);
    const [emojiLoading, setEmojiLoading] = useState(false);
    const [emojiPage, setEmojiPage] = useState(0);
    const [emojiSearched, setEmojiSearched] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [modalContent, setModalContent] = useState<{ type: 'emoji', data: any } | null>(null);

    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const ITEMS_PER_PAGE = 24;

    const handleAddEmojiAsBrowserSource = async (emoji: any, sourceName:string) => {
        if (!obsServiceInstance || !isConnected || !currentProgramScene) {
            toast({ variant: 'destructive', title: 'OBS not connected.' });
            return;
        }
        try {
            const emojiChar = getEmojiChar(emoji);
            await obsServiceInstance.addEmojiAsBrowserSource(currentProgramScene, emojiChar, generateSourceName(sourceName));
            toast({ title: 'Success', description: `Added ${sourceName} to OBS.` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: `Failed to add source: ${err.message}` });
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

    const getModalActions = (type: 'emoji', data: any): ModalAction[] => {
        const emojiChar = getEmojiChar(data);
        return [
            { label: 'Add as Browser Source', onClick: () => handleAddEmojiAsBrowserSource(
                emojiChar,
                data.unicodeName || data.name || data.slug || 'emoji'
            ), variant: 'primary' },
            { label: 'Copy Emoji', onClick: () => { 
                copyToClipboard(emojiChar); 
                toast({ title: 'Info', description: 'Copied Emoji!' }); 
            } },
        ];
    };

    const handleEmojiSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emojiQuery.trim()) return;

        setEmojiLoading(true);
        setEmojiResults([]);
        setEmojiSearched(true);
        setSearchError(null);
        setEmojiPage(0);

        try {
            let results: EmojiResult[] = [];
            const query = emojiQuery.toLowerCase();

            if (emojiApi === 'emojihub') { // Example: No key needed
                const res = await fetch('https://emojihub.yurace.pro/api/all');
                if (!res.ok) throw new Error(`EmojiHub API error: ${res.status}`);
                results = (await res.json()).filter((emoji: any) =>
                    emoji.name.toLowerCase().includes(query) ||
                    emoji.category.toLowerCase().includes(query) ||
                    emoji.group.toLowerCase().includes(query)
                );
            } else if (emojiApi === 'openemoji') { // Example: Needs a key
                const apiKeyToUse = useApiKeyStore.getState().getApiKeyOverride(ApiService.OPENEMOJI);
                if (!apiKeyToUse || apiKeyToUse.includes('your_')) { // Keep check for placeholder
                    const errorMsg = `OpenEmoji API key is missing or invalid. Please configure it.`;
                    setSearchError(errorMsg);
                    toast({ variant: 'destructive', title: errorMsg });
                    setEmojiLoading(false);
                    return;
                }
                const res = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(query)}&access_key=${apiKeyToUse}`);
                if (!res.ok) throw new Error(`OpenEmoji API error: ${res.status}`);
                results = await res.json();
            }
            setEmojiResults(results.slice(0, 48));
        } catch (err: any) {
            console.error('Emoji fetch error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            toast({ variant: 'destructive', title: `Error fetching Emojis: ${errorMessage}` });
        }
        setEmojiLoading(false);
    }, [emojiApi, emojiQuery, obsServiceInstance, currentProgramScene, isConnected]);

    const getPaginatedItems = (items: any[], page: number) => {
        const start = page * ITEMS_PER_PAGE;
        return items.slice(start, start + ITEMS_PER_PAGE);
    };

    const getTotalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

    return (
        <CollapsibleCard
            title="Emojis"
            emoji="😀"
            isOpen={true}
            onToggle={() => {}}
            accentColor={accentColor}
        >
            <CardContent className="px-3 pb-3 pt-2">
                <div>
                    <form onSubmit={handleEmojiSearch} className="flex items-center gap-1 mb-0.5">
                        <input
                            type="text"
                            value={emojiQuery}
                            onChange={(e) => setEmojiQuery(e.target.value)}
                            placeholder="Search for emojis..."
                            className="flex-grow rounded-md border border-border bg-background px-1 py-1.5 text-xs focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors placeholder:text-muted-foreground"
                        />
                        <FaviconDropdown
                            options={EMOJI_APIS}
                            value={emojiApi}
                            onChange={setEmojiApi}
                            className="min-w-[100px]"
                            accentColor={accentColor}
                        />
                        <Button type="submit" disabled={emojiLoading || !emojiQuery.trim()} size="sm">{emojiLoading ? 'Searching...' : 'Search'}</Button>
                    </form>
                    {emojiLoading && <div className="text-center text-xs">Loading...</div>}
                    {!emojiLoading && searchError && (
                        <div className="text-center text-destructive text-xs">{searchError}</div>
                    )}
                    {!emojiLoading && !searchError && emojiSearched && emojiResults.length === 0 && (
                        <div className="text-center text-muted-foreground text-xs">No results found.</div>
                    )}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                        {getPaginatedItems(emojiResults, emojiPage).map((emoji, index) => (
                            <div
                                key={(emoji.slug || emoji.name || emoji.unicodeName || getEmojiChar(emoji) || String(index)).toString()}
                                className="relative group cursor-pointer p-1 bg-slate-800 rounded-md flex items-center justify-center aspect-square text-2xl sm:text-3xl md:text-4xl"
                                onClick={() => setModalContent({ type: 'emoji', data: emoji })}
                            >
                                {getEmojiChar(emoji)}
                            </div>
                        ))}
                    </div>
                    {getTotalPages(emojiResults) > 1 && (
                        <div className="flex justify-center items-center space-x-1 mt-0.5">
                            <Button variant="secondary" size="sm" onClick={() => setEmojiPage(emojiPage - 1)} disabled={emojiPage === 0}>Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {emojiPage + 1} of {getTotalPages(emojiResults)}</span>
                            <Button variant="secondary" size="sm" onClick={() => setEmojiPage(emojiPage + 1)} disabled={emojiPage >= getTotalPages(emojiResults) - 1}>Next</Button>
                        </div>
                    )}
                </div>
            </CardContent>
            {modalContent && (
                <Modal
                    isOpen={!!modalContent}
                    onClose={() => setModalContent(null)}
                    title="Emoji Preview"
                    actions={getModalActions(modalContent.type, modalContent.data)}
                >
                    <div className="p-4 bg-slate-800 rounded-md flex justify-center items-center aspect-square max-w-xs mx-auto"><div className="text-[12rem] leading-none">{getEmojiChar(modalContent.data)}</div></div>
                </Modal>
            )}
        </CollapsibleCard>
    );
};

export default EmojiSearch;
