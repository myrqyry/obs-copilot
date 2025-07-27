import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { catppuccinAccentColorsHexMap } from '../types';
import { Card, CardContent } from './ui/Card';
import HtmlTemplateBuilder from './HtmlTemplateBuilder';
import { CollapsibleCard } from './common/CollapsibleCard';
import GifSearch from './GifSearch';
import SvgSearch from './SvgSearch';
import EmojiSearch from './EmojiSearch';
import BackgroundSearch from './BackgroundSearch';

const StreamingAssetsTab = React.memo(() => {
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    const [openCards, setOpenCards] = useState<{
        html: boolean;
        giphy: boolean;
        svg: boolean;
        emoji: boolean;
        backgrounds: boolean;
    }>({
        html: false,
        giphy: true,
        svg: false,
        emoji: false,
        backgrounds: false,
    });

    const toggleCard = (key: keyof typeof openCards) => {
        setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-2 max-w-4xl mx-auto p-0">
            <CollapsibleCard
                title="HTML Templates"
                emoji="📄"
                isOpen={openCards.html}
                onToggle={() => toggleCard('html')}
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
