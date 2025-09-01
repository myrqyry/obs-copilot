// src/components/ui/CreateTab.tsx
import React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Card, CardContent } from './Card';
import { CustomButton as Button } from './CustomButton';
import ImageGenerator from '../../features/media/ImageGeneration';
import MusicGenerator from '../../features/media/MusicGeneration';
import TTSGenerator from '../../features/media/SpeechGeneration';

const CreateTab: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Collapsible Card for Image Generation */}
      <Collapsible.Root className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold">
            <span>Image Generation 🖼️</span>
            <span className="radix-state-open:rotate-180 transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent className="p-4 pt-0">
            <ImageGenerator />
          </CardContent>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Collapsible Card for Music Generation */}
      <Collapsible.Root className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold">
            <span>Music Generation 🎵</span>
            <span className="radix-state-open:rotate-180 transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent className="p-4 pt-0">
            <MusicGenerator />
          </CardContent>
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Collapsible Card for TTS Generation */}
      <Collapsible.Root className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold">
            <span>Speech Generation (TTS) 🗣️</span>
            <span className="radix-state-open:rotate-180 transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent className="p-4 pt-0">
            <TTSGenerator />
          </CardContent>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
};

export default CreateTab;
