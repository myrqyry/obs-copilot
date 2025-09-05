// src/components/ui/CreateTab.tsx
import React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { CardContent } from './Card';
import { CustomButton as Button } from './CustomButton';
import ImageGenerator from '../../features/media/ImageGeneration';
import MusicGenerator from '../../features/media/MusicGeneration';
import TTSGenerator from '../../features/media/SpeechGeneration';
import VideoGenerator from '../../features/media/VideoGeneration';
import AIImageEditor from '../../features/media/AIImageEditor';

const CreateTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-foreground">Create Studio</h1>
        <p className="text-muted-foreground mt-1">Generate and edit content for your stream</p>
      </div>

      {/* Image Editor - Always visible at the top */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="emoji">🪄</span>
            <span>Image Editor</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Edit, enhance, and customize your images</p>
        </div>
        <div className="p-4">
          <AIImageEditor />
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Collapsible Card for Image Generation */}
        <Collapsible.Root className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🖼️</span>
                <div>
                  <span>Image Generation</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">Create stunning AI-generated images</p>
                </div>
              </div>
              <span className="radix-state-open:rotate-180 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <CardContent className="p-6 pt-0 border-t border-border">
              <ImageGenerator />
            </CardContent>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Collapsible Card for Music Generation */}
        <Collapsible.Root className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎵</span>
                <div>
                  <span>Music Generation</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">Create custom background music and sound effects</p>
                </div>
              </div>
              <span className="radix-state-open:rotate-180 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <CardContent className="p-6 pt-0 border-t border-border">
              <MusicGenerator />
            </CardContent>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Collapsible Card for TTS Generation */}
        <Collapsible.Root className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🗣️</span>
                <div>
                  <span>Speech Generation (TTS)</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">Convert text to natural-sounding speech</p>
                </div>
              </div>
              <span className="radix-state-open:rotate-180 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <CardContent className="p-6 pt-0 border-t border-border">
              <TTSGenerator />
            </CardContent>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Collapsible Card for Video Generation */}
        <Collapsible.Root className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <Collapsible.Trigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center text-left py-4 px-6 font-semibold hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎬</span>
                <div>
                  <span>Video Generation</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">Create AI-generated videos and animations</p>
                </div>
              </div>
              <span className="radix-state-open:rotate-180 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <CardContent className="p-6 pt-0 border-t border-border">
              <VideoGenerator />
            </CardContent>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  );
};

export default CreateTab;
