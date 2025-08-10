import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useSettingsStore } from '@/store/settingsStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { geminiService } from '@/services/geminiService';
import { CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/common/TextInput';
import Tooltip from '@/components/ui/Tooltip';
import InlineMusicControls from '@/components/ui/InlineMusicControls';
import { ImageEditor } from '@/features/media/ImageEditor';
import { Modal } from '@/components/ui/Modal';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { copyToClipboard } from '@/utils/persistence';
import { pcm16ToWavUrl } from '@/lib/pcmToWavUrl';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '@/types';
import { generateChuteImage } from '@/services/chuteImageService';
import ImageGeneration from '@/features/media/ImageGeneration';
import SpeechGeneration from '@/features/media/SpeechGeneration';
import MusicGeneration from '@/features/media/MusicGeneration';
 
const CreateTab: React.FC = () => {
    const { obsServiceInstance } = useConnectionManagerStore();
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';
 
    // Collapsible state for each section
    const [openImageEdit, setOpenImageEdit] = useState(false);
 
    const addBrowserSource = (sceneName: string, sourceName: string, url: string, settings: any) => {
        if (obsServiceInstance) {
            obsServiceInstance.addBrowserSource(sceneName, url, sourceName, settings);
        }
    };
 
    const addImageSource = (sceneName: string, sourceName: string, url: string) => {
        if (obsServiceInstance) {
            obsServiceInstance.addImageSource(sceneName, url, sourceName);
        }
    };
 
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
                        <ImageEditor />
                    </CardContent>
                </CollapsibleCard>
 
                <SpeechGeneration />
 
                <MusicGeneration />
            </div>
        </>
    );
};
 
export default CreateTab;
