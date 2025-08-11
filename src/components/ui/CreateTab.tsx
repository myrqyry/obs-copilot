import React from 'react';
import ImageGeneration from '@/features/media/ImageGeneration';
import SpeechGeneration from '@/features/media/SpeechGeneration';
import MusicGeneration from '@/features/media/MusicGeneration';

const CreateTab: React.FC = () => {
    return (
        <div className="flex flex-col gap-4 p-2 md:p-4 w-full max-w-3xl mx-auto">
            <ImageGeneration />
            <SpeechGeneration />
            <MusicGeneration />
        </div>
    );
};
 
export default CreateTab;
