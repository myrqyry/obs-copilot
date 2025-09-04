// src/components/ui/AssetSearchTab.tsx
import React, { useState } from 'react';
import { EnhancedAssetSearch } from '@/components/asset-search/EnhancedAssetSearch';
import { ASSET_SEARCH_CONFIGS } from '@/config/assetSearchConfigs';
import { StandardApiItem, AssetModalActions } from '@/types/assetSearch';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { toast } from '@/components/ui/toast';
import { copyToClipboard } from '@/utils/persistence';
import SecureHtmlRenderer from '@/components/ui/SecureHtmlRenderer';

const AssetSearchTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('backgrounds');

  // Custom actions for GIFs
  const getGifActions = (item: StandardApiItem): AssetModalActions[] => [
    {
      label: 'Add as Media Source',
      onClick: () => {
        // Custom GIF handling logic
        toast({ title: 'GIF Added', description: `Added "${item.title}" as media source` });
      },
      variant: 'primary',
      icon: '🎬',
    },
    {
      label: 'Copy GIF URL',
      onClick: () => {
        copyToClipboard(item.url);
        toast({ title: 'Copied', description: 'GIF URL copied to clipboard' });
      },
      variant: 'secondary',
      icon: '📋',
    },
  ];

  // Custom grid renderer for emojis
  const renderEmojiGrid = (item: StandardApiItem, onClick: () => void) => (
    <div 
      key={item.id} 
      className="text-5xl flex items-center justify-center cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg h-full transition-all duration-200 transform hover:scale-105"
      onClick={onClick}
      title={item.title}
    >
      {item.character}
    </div>
  );

  // Custom modal renderer for SVG icons
  const renderSvgModal = (item: StandardApiItem) => (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-80 h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
        {item.svgContent ? (
          <SecureHtmlRenderer 
            htmlContent={item.svgContent} 
            allowedTags={['svg','path','g','circle','rect','line','polygon','polyline','ellipse','defs','use','linearGradient','radialGradient','stop']}
            allowedAttributes={['viewBox','d','fill','stroke','stroke-width','cx','cy','r','x','y','width','height','points','x1','y1','x2','y2','rx','ry','transform','id','href','xlink:href','offset','stop-color','stop-opacity']}
            className="w-full h-full"
          />
        ) : (
          <div className="text-gray-400">SVG Preview Not Available</div>
        )}
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
        <p className="text-gray-600">by {item.author}</p>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {item.tags.slice(0, 8).map(tag => (
              <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const categories = [
    { key: 'backgrounds', label: 'Backgrounds', emoji: '🖼️', description: 'High-quality background images' },
    { key: 'gifs', label: 'GIFs', emoji: '🎬', description: 'Animated GIFs and stickers' },
    { key: 'icons', label: 'Icons', emoji: '🎨', description: 'Vector icons and graphics' },
    { key: 'emojis', label: 'Emojis', emoji: '😀', description: 'Unicode emojis and symbols' },
    { key: 'images', label: 'Images', emoji: '📸', description: 'General purpose images' },
    { key: 'stickers', label: 'Stickers', emoji: '🏷️', description: 'Stickers and decals' },
  ];

  const activeConfig = ASSET_SEARCH_CONFIGS[activeCategory] || [];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asset Search</h1>
            <p className="text-sm text-muted-foreground">
              Search and add assets directly to your OBS scenes
            </p>
          </div>
          <div className="text-4xl">🔍</div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              variant={activeCategory === category.key ? 'default' : 'secondary'}
              size="sm"
              className="flex items-center gap-2"
            >
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </Button>
          ))}
        </div>

        {/* Category Description */}
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {categories.find(c => c.key === activeCategory)?.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeConfig.length > 0 ? (
          <EnhancedAssetSearch
            title={categories.find(c => c.key === activeCategory)?.label || 'Assets'}
            emoji={categories.find(c => c.key === activeCategory)?.emoji || '🔍'}
            apiConfigs={activeConfig}
            maxResults={12}
            gridCols={4}
            gridRows={3}
            showFilters={true}
            defaultFilters={{
              rating: 'g',
              limit: 12,
              lang: 'en',
            }}
            customActions={activeCategory === 'gifs' ? getGifActions : undefined}
            customGridRenderer={activeCategory === 'emojis' ? renderEmojiGrid : undefined}
            customModalRenderer={activeCategory === 'icons' ? renderSvgModal : undefined}
            className="max-w-none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Coming Soon
            </h3>
            <p className="text-muted-foreground">
              {categories.find(c => c.key === activeCategory)?.label} search is not yet available.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>💡 Tip: Use specific search terms for better results</span>
            <span>🔑 Some APIs require authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by multiple APIs</span>
            <div className="flex gap-1">
              {activeConfig.slice(0, 3).map((config, index) => (
                <span key={index} className="px-2 py-1 bg-background rounded text-xs">
                  {config.label}
                </span>
              ))}
              {activeConfig.length > 3 && (
                <span className="px-2 py-1 bg-background rounded text-xs">
                  +{activeConfig.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetSearchTab;
