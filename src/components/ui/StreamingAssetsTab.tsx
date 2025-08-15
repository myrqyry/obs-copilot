// src/components/ui/StreamingAssetsTab.tsx
import React from 'react';
import GifSearch from '@/features/asset-search/GifSearch';
import SvgSearch from '@/features/asset-search/SvgSearch';
import EmojiSearch from '@/features/asset-search/EmojiSearch';
import BackgroundSearch from '@/features/asset-search/BackgroundSearch';
import HtmlTemplateBuilder from '@/features/templates/HtmlTemplateBuilder';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { CardContent } from '@/components/ui/Card';

const StreamingAssetsTab = () => {
    // State for the HTML template builder can remain
    const [htmlOpen, setHtmlOpen] = React.useState(false);

    return (
        <div className="space-y-2 max-w-4xl mx-auto p-0">
            <CollapsibleCard title="HTML Templates" emoji="📄" isOpen={htmlOpen} onToggle={() => setHtmlOpen(prev => !prev)}>
                <CardContent className="px-3 pb-3 pt-2">
                    <HtmlTemplateBuilder accentColorName={"mauve" /* Pass a default or get from store */} />
                </CardContent>
            </CollapsibleCard>

            {/* Your clean, refactored components! */}
            <BackgroundSearch />
            <GifSearch />
            <SvgSearch />
            <EmojiSearch />
        </div>
    );
};

export default StreamingAssetsTab;