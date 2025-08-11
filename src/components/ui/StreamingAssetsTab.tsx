import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { catppuccinAccentColorsHexMap } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import HtmlTemplateBuilder from '@/features/templates/HtmlTemplateBuilder';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import GifSearch from '@/features/asset-search/GifSearch';
import SvgSearch from '@/features/asset-search/SvgSearch';
import EmojiSearch from '@/features/asset-search/EmojiSearch';
import BackgroundSearch from '@/features/asset-search/BackgroundSearch';

const StreamingAssetsTab = React.memo(() => {
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const [htmlOpen, setHtmlOpen] = useState(false);

    return (
        <div className="space-y-2 max-w-4xl mx-auto p-0">
            <CollapsibleCard
                title="HTML Templates"
                emoji="📄"
                isOpen={htmlOpen}
                onToggle={() => setHtmlOpen(prev => !prev)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3 pt-2">
                    <HtmlTemplateBuilder accentColorName={accentColorName} />
                </CardContent>
            </CollapsibleCard>

            <GifSearch />
            <SvgSearch />
            <EmojiSearch />
            <BackgroundSearch />
        </div>
    );
});

export default StreamingAssetsTab;
