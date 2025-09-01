// src/features/asset-search/EmojiSearch.tsx
import React from 'react';
import AssetSearch from './AssetSearch';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { toast } from '@/components/ui/toast';
import { copyToClipboard } from '@/utils/persistence';
import { generateSourceName } from '@/utils/obsSourceHelpers';

const EMOJI_APIS = [
    { value: 'emoji-api', label: 'Emoji API', domain: 'emoji-api.com' },
    // Add other Emoji APIs here
];

const mapEmojiToStandard = (item: any) => ({
    id: item.slug,
    title: item.unicodeName,
    character: item.character,
    // Add source and author properties to match StandardApiItem type
    source: 'emoji-api', // Assuming this is the source
    author: 'Unicode Consortium', // Default author for emojis
    // Add url and thumbnail properties to match StandardApiItem type
    url: `https://emoji-api.com/emoji/${item.slug}`, // Example URL
    thumbnail: `https://emoji-api.com/emoji/${item.slug}/thumbnail` // Example thumbnail URL
});

const EmojiSearch: React.FC = () => {
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

    const handleAddAsBrowserSource = async (url: string, title: string) => {
        if (!isConnected || !currentProgramScene || !obsServiceInstance) {
            toast({ title: 'OBS Not Connected', variant: 'destructive' });
            return;
        }
        const sourceName = generateSourceName(`Emoji-${title}`);
        await (obsServiceInstance as any).addBrowserSource(currentProgramScene, url, sourceName);
        toast({ title: 'Success', description: `Added "${sourceName}" to OBS.` });
    };

    const getModalActions = (item: any) => [
        { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(item.url, item.title), variant: 'primary' },
        { label: 'Copy URL', onClick: () => { copyToClipboard(item.url); toast({ title: 'Copied!' }); } },
        { label: 'Copy Emoji Character', onClick: () => { copyToClipboard(item.character); toast({ title: 'Copied!' }); } },
    ];

    const renderGridItem = (item: any, onClick: () => void) => (
        <div key={item.id} className="text-4xl flex items-center justify-center cursor-pointer bg-slate-800 rounded-md h-full" onClick={onClick}>
            {item.character}
        </div>
    );

    const renderModalContent = (item: any) => (
        <div className="text-9xl flex items-center justify-center p-8">{item.character}</div>
    );

    return (
        <AssetSearch
            title="Emojis"
            emoji="😀"
            apiConfigs={EMOJI_APIS}
            apiMapper={mapEmojiToStandard}
            renderGridItem={renderGridItem}
            renderModalContent={renderModalContent}
            getModalActions={getModalActions}
        />
    );
};

export default EmojiSearch;
