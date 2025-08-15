// src/features/asset-search/BackgroundSearch.tsx
import React from 'react';
import AssetSearch from './AssetSearch';
import { apiMappers } from '@/config/api-mappers';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { toast } from '@/components/ui/toast';
import { copyToClipboard } from '@/utils/persistence';
import { generateSourceName } from '@/utils/obsSourceHelpers';

// Define the APIs available for this search type
const BACKGROUND_APIS = [
    { value: 'unsplash', label: 'Unsplash', domain: 'unsplash.com' },
    { value: 'pexels', label: 'Pexels', domain: 'pexels.com' },
    { value: 'pixabay', label: 'Pixabay', domain: 'pixabay.com' },
];

const BackgroundSearch: React.FC = () => {
    const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

    const handleAddAsBrowserSource = async (url: string, title: string) => {
        if (!isConnected || !currentProgramScene || !obsServiceInstance) {
            toast({ title: 'OBS Not Connected', variant: 'destructive' });
            return;
        }
        const sourceName = generateSourceName(`BG-${title}`);
        await (obsServiceInstance as any).addBrowserSource(currentProgramScene, url, sourceName);
        toast({ title: 'Success', description: `Added "${sourceName}" to OBS.` });
    };

    const getModalActions = (item: any) => [
        { label: 'Add as Browser Source', onClick: () => handleAddAsBrowserSource(item.url, item.title), variant: 'primary' },
        { label: 'Copy URL', onClick: () => { copyToClipboard(item.url); toast({ title: 'Copied!' }); } },
    ];

    const renderGridItem = (item: any, onClick: () => void) => (
        <div key={item.id} className="relative group cursor-pointer h-full" onClick={onClick}>
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-white text-xs truncate">{item.title}</p>
            </div>
        </div>
    );

    const renderModalContent = (item: any) => (
        <img src={item.url} alt={item.title} className="max-w-full max-h-[70vh] mx-auto rounded" />
    );

    return (
        <AssetSearch
            title="Backgrounds"
            emoji="🖼️"
            apiConfigs={BACKGROUND_APIS}
            apiMapper={apiMappers.unsplash} // We'll need to expand this mapper
            renderGridItem={renderGridItem}
            renderModalContent={renderModalContent}
            getModalActions={getModalActions}
        />
    );
};

export default BackgroundSearch;