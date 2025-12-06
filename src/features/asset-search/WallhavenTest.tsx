// src/features/asset-search/WallhavenTest.tsx
import React, { useState } from 'react';
import { EnhancedAssetSearch } from '@/shared/components/asset-search/EnhancedAssetSearch';
import { ASSET_SEARCH_CONFIGS } from '@/config/assetSearchConfigs';

export const WallhavenTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState('backgrounds');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Wallhaven API Test</h1>
      
      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded-md mr-2 ${activeTab === 'backgrounds' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => setActiveTab('backgrounds')}
        >
          Backgrounds
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === 'images' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          onClick={() => setActiveTab('images')}
        >
          Images
        </button>
      </div>

      {activeTab === 'backgrounds' && (
        <EnhancedAssetSearch
          title="Wallhaven Backgrounds"
          emoji="🖼️"
          apiConfigs={ASSET_SEARCH_CONFIGS.backgrounds}
          maxResults={12}
        />
      )}

      {activeTab === 'images' && (
        <EnhancedAssetSearch
          title="Wallhaven Images"
          emoji="🎨"
          apiConfigs={ASSET_SEARCH_CONFIGS.images.filter(config => config.value === 'wallhaven')}
          maxResults={12}
        />
      )}
    </div>
  );
};

export default WallhavenTest;
