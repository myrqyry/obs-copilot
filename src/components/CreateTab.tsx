import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useAppStore } from '../store/appStore';
import { GeminiService } from '../services/geminiService';
import { CardContent } from './ui/Card';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import Tooltip from './ui/Tooltip';
import InlineMusicControls from './InlineMusicControls';
import { ImageEditor } from './ImageEditor';
import { Modal } from './common/Modal';
import { addBrowserSource, addImageSource } from '../services/obsService';
import { generateSourceName } from '../utils/obsSourceHelpers';
import { copyToClipboard } from '../utils/persistence';
import { pcm16ToWavUrl } from '../lib/pcmToWavUrl';
import { CollapsibleCard } from './common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '../types';
import { generateChuteImage } from '../services/chuteImageService';
import ImageGeneration from './ImageGeneration';
import SpeechGeneration from './SpeechGeneration';
import MusicGeneration from './MusicGeneration';

const CreateTab: React.FC = () => {
    const accentColorName = useAppStore(state => state.theme.accent);
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
