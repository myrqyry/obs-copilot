import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Palette, Image, FileText, Smile } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedAssetSearch } from '@/components/asset-search/EnhancedAssetSearch';
import { AssetSettingsPanel } from '@/components/asset-search/AssetSettingsPanel';
import { getConfigsByCategory } from '@/config/assetSearchConfigs';
import useConfigStore from '@/store/configStore';

interface CategoryInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const categoryInfoMap: Record<string, CategoryInfo> = {
  backgrounds: {
    id: 'backgrounds',
    name: 'Backgrounds',
    icon: <Image className="w-5 h-5" />,
    description: 'High-quality wallpapers and backgrounds',
    color: 'blue'
  },
  gifs: {
    id: 'gifs',
    name: 'GIFs & Animations',
    icon: <FileText className="w-5 h-5" />,
    description: 'Animated GIFs and moving images',
    color: 'green'
  },
  images: {
    id: 'images',
    name: 'Images & Photos',
    icon: <Image className="w-5 h-5" />,
    description: 'Stock photos and artistic images',
    color: 'purple'
  },
  icons: {
    id: 'icons',
    name: 'Icons & SVGs',
    icon: <Palette className="w-5 h-5" />,
    description: 'Vector icons and scalable graphics',
    color: 'orange'
  },
  stickers: {
    id: 'stickers',
    name: 'Stickers',
    icon: <Smile className="w-5 h-5" />,
    description: 'Decorative stickers and overlays',
    color: 'pink'
  },
  emojis: {
    id: 'emojis',
    name: 'Emojis',
    icon: <Smile className="w-5 h-5" />,
    description: 'Unicode emojis and emoticons',
    color: 'yellow'
  }
};

const StreamingAssetsTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('backgrounds');
  const [showSettings, setShowSettings] = useState(false);
  const config = useConfigStore();

  const categoryConfigs = useMemo(() => {
    return getConfigsByCategory(activeCategory as any);
  }, [activeCategory]);

  const missingApiKeys = useMemo(() => {
    return categoryConfigs
      .filter(config => config.requiresAuth)
      .filter(serviceConfig => {
        const keyName = `${serviceConfig.value.toUpperCase()}_API_KEY`;
        return !config[keyName as keyof typeof config];
      });
  }, [categoryConfigs, config]);

  const currentCategoryInfo = categoryInfoMap[activeCategory];

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Streaming Assets</h2>
              <p className="text-gray-600">Search and add media assets to your OBS scenes</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-white border-b">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start bg-transparent border-b-0 p-0">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex">
                  {Object.values(categoryInfoMap).map(category => {
                    const configs = getConfigsByCategory(category.id as any);
                    const hasApiKeys = configs.every(serviceConfig =>
                      !serviceConfig.requiresAuth || config[`${serviceConfig.value.toUpperCase()}_API_KEY` as keyof typeof config]
                    );

                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex items-center gap-2 px-4 py-3 border-b-2 data-[state=active]:border-blue-500"
                      >
                        <div className={`p-1.5 rounded-lg bg-${category.color}-100`}>
                          {category.icon}
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            {!hasApiKeys && (
                              <Badge variant="outline" className="text-xs">
                                Setup Required
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 hidden sm:block">
                            {configs.length} source{configs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </TabsTrigger>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {missingApiKeys.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Settings className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-orange-900">API Keys Required</h3>
                        <p className="text-sm text-orange-700 mb-2">
                          Some services require API keys to function:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingApiKeys.map(service => (
                            <Badge key={service.value} variant="outline" className="text-orange-700 border-orange-300">
                              {service.label}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-orange-700 border-orange-300"
                          onClick={() => setShowSettings(true)}
                        >
                          Configure API Keys
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {currentCategoryInfo && (
                <div className="text-center py-4">
                  <div className={`inline-flex p-3 rounded-full bg-${currentCategoryInfo.color}-100 mb-3`}>
                    {currentCategoryInfo.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {currentCategoryInfo.name}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {currentCategoryInfo.description}
                  </p>
                </div>
              )}
              <Card>
                <CardContent className="p-0">
                  <EnhancedAssetSearch
                    title={currentCategoryInfo?.name || 'Assets'}
                    emoji=""
                    apiConfigs={categoryConfigs}
                    maxResults={18}
                    gridCols={6}
                    gridRows={3}
                    showFilters={true}
                    className="border-0 shadow-none"
                  />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
      {showSettings && (
        <AssetSettingsPanel
          activeCategory={activeCategory}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default StreamingAssetsTab;