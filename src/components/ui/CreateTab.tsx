import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { CardContent } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '@/types';
import ImageGeneration from '@/features/media/ImageGeneration';
import SpeechGeneration from '@/features/media/SpeechGeneration';
import MusicGeneration from '@/features/media/MusicGeneration';
 
const CreateTab: React.FC = () => {
    const { obsServiceInstance } = useConnectionManagerStore();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';
 
    // Collapsible state for each section
    const [openImageEdit, setOpenImageEdit] = useState(false);
 
    return (
        <>
 
            <div className="flex flex-col gap-4 p-2 md:p-4 w-full max-w-3xl mx-auto">
                <ImageGeneration />
 
                {/* Image Editing (Background Removal) Section */}
                <CollapsibleCard
                    title="Image Editing (Background Removal)"
                    emoji="🪄"
                    isOpen={openImageEdit}
                    onToggle={() => setOpenImageEdit(!openImageEdit)}
                    accentColor={accentColor}
                >
                    <CardContent className="px-3 pb-3 pt-2">
                        {/* ImageEditor removed (unused) */}
                    </CardContent>
                </CollapsibleCard>
 
                <SpeechGeneration />
 
                <MusicGeneration />
            </div>
        </>
    );
};
 
export default CreateTab;
