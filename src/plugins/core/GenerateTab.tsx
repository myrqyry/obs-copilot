import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Image,
  Music,
  Mic,
  Video,
  Sparkles,
  Download,
  Settings,
  Palette,
  Camera,
  Headphones
} from 'lucide-react';
import { EnhancedImageGenerator } from '@/components/generate/EnhancedImageGenerator';
import { SpeechGenerator } from '@/components/generate/SpeechGenerator';
import { MusicGenerator } from '@/components/generate/MusicGenerator';
import { VideoGenerator } from '@/components/generate/VideoGenerator';
import { GenerationHistory } from '@/components/generate/GenerationHistory';
import { useGenerateStore } from '@/store/generateStore';

interface GenerateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  badge?: string;
}

const generateCategories: GenerateCategory[] = [
  {
    id: 'image',
    name: 'Images',
    icon: <Image className="w-5 h-5" />,
    description: 'Create stunning AI-generated images and artwork',
    color: 'blue',
    badge: 'New Models'
  },
  {
    id: 'speech',
    name: 'Speech',
    icon: <Mic className="w-5 h-5" />,
    description: 'Convert text to natural-sounding speech',
    color: 'green',
    badge: 'Multi-Speaker'
  },
  {
    id: 'music',
    name: 'Music',
    icon: <Music className="w-5 h-5" />,
    description: 'Generate background music and sound effects',
    color: 'purple',
    badge: 'Preview'
  },
  {
    id: 'video',
    name: 'Video',
    icon: <Video className="w-5 h-5" />,
    description: 'Create AI-generated videos and animations',
    color: 'orange',
    badge: 'Coming Soon'
  }
];

const GenerateTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('image');
  const [showHistory, setShowHistory] = useState(false);
  const {
    generationHistory,
    isGenerating,
    currentModel,
    clearHistory,
    exportHistory
  } = useGenerateStore();

  const handleClearHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const handleExportHistory = useCallback(() => {
    exportHistory();
  }, [exportHistory]);

  const currentCategory = generateCategories.find(cat => cat.id === activeCategory);
  const historyCount = generationHistory.length;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Generation Studio</h2>
                <p className="text-gray-600">Create amazing content with Gemini AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && (
                <Badge variant="outline" className="animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generating...
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <Camera className="w-4 h-4 mr-2" />
                History ({historyCount})
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start bg-transparent border-b-0 p-0">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex">
                  {generateCategories.map(category => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex items-center gap-3 px-6 py-4 border-b-2 data-[state=active]:border-purple-500"
                    >
                      <div className={`p-2 rounded-lg bg-${category.color}-100`}>
                        {category.icon}
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.name}</span>
                          {category.badge && (
                            <Badge
                              variant="secondary"
                              className={`text-xs bg-${category.color}-100 text-${category.color}-700`}
                            >
                              {category.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 hidden sm:block">
                          {category.description}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </div>
              </ScrollArea>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {/* Category Header */}
              {currentCategory && (
                <div className="text-center py-6 mb-6">
                  <div className={`inline-flex p-4 rounded-full bg-${currentCategory.color}-100 mb-4`}>
                    {currentCategory.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentCategory.name} Generation
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    {currentCategory.description}
                  </p>
                  {currentModel && (
                    <Badge variant="outline" className="mt-2">
                      Using {currentModel}
                    </Badge>
                  )}
                </div>
              )}

              {/* Generation Components */}
              <Tabs value={activeCategory} className="w-full">
                <TabsContent value="image" className="mt-0">
                  <EnhancedImageGenerator />
                </TabsContent>

                <TabsContent value="speech" className="mt-0">
                  <SpeechGenerator />
                </TabsContent>

                <TabsContent value="music" className="mt-0">
                  <MusicGenerator />
                </TabsContent>

                <TabsContent value="video" className="mt-0">
                  <VideoGenerator />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Generation History Sidebar */}
      {showHistory && (
        <GenerationHistory
          onClose={() => setShowHistory(false)}
          onClear={handleClearHistory}
          onExport={handleExportHistory}
        />
      )}
    </div>
  );
};

export default GenerateTab;