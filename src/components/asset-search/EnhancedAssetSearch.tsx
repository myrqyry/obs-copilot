// src/components/asset-search/EnhancedAssetSearch.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useGenericApiSearch } from '@/hooks/useGenericApiSearch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { FaviconDropdown } from '@/components/common/FaviconDropdown';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/toast';
import { copyToClipboard } from '@/utils/persistence';
import { generateSourceName } from '@/utils/obsSourceHelpers';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { ObsClientImpl as ObsClient } from '@/services/obsClient';
import { handleAppError, createToastError } from '@/lib/errorUtils';
import { StandardApiItem, AssetSearchConfig, SearchFilters, AssetModalActions } from '@/types/assetSearch';
import { apiMappers } from '@/config/enhancedApiMappers';
import { EnhancedSearchFilters } from './EnhancedSearchFilters';

interface EnhancedAssetSearchProps {
  title: string;
  emoji: string;
  apiConfigs: AssetSearchConfig[];
  className?: string;
  defaultFilters?: SearchFilters;
  maxResults?: number;
  gridCols?: number;
  gridRows?: number;
  showFilters?: boolean;
  customActions?: (item: StandardApiItem) => AssetModalActions[];
  customGridRenderer?: (item: StandardApiItem, onClick: () => void) => React.ReactNode;
  customModalRenderer?: (item: StandardApiItem) => React.ReactNode;
}

export const EnhancedAssetSearch: React.FC<EnhancedAssetSearchProps> = ({
  title,
  emoji,
  apiConfigs,
  className = '',
  defaultFilters = {},
  maxResults = 12,
  gridCols = 4,
  gridRows = 3,
  showFilters = true,
  customActions,
  customGridRenderer,
  customModalRenderer,
}) => {
  const [selectedApi, setSelectedApi] = useState(apiConfigs[0]?.value || '');
  const [query, setQuery] = useState('');
  const [modalContent, setModalContent] = useState<StandardApiItem | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { results, loading, searched, search } = useGenericApiSearch(selectedApi as any);
  const { obsServiceInstance, isConnected, currentProgramScene } = useConnectionManagerStore();

  const selectedConfig = useMemo(() => 
    apiConfigs.find(config => config.value === selectedApi),
    [apiConfigs, selectedApi]
  );

  // Prepare deduped options for dropdown to avoid duplicate keys across categories
  const apiOptionsForDropdown = useMemo(() => {
    const map = new Map<string, AssetSearchConfig>();
    for (const cfg of apiConfigs) {
      if (!map.has(cfg.value)) map.set(cfg.value, cfg);
    }
    return Array.from(map.values());
  }, [apiConfigs]);

  const mappedResults = useMemo<StandardApiItem[]>(() => {
    if (!results || !selectedApi) return [];
    const mapper = (apiMappers as any)[selectedApi];
    if (!mapper) return [];
    return results.slice(0, maxResults).map(mapper);
  }, [results, selectedApi, maxResults]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    search(query, filters);
  }, [query, filters, search]);

  const handleApiChange = useCallback((newApi: string) => {
    setSelectedApi(newApi);
    setFilters(defaultFilters); // Reset filters when changing API
  }, [defaultFilters]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // OBS Integration Actions
  const handleAddAsBrowserSource = useCallback(async (url: string, title: string) => {
    if (!isConnected || !obsServiceInstance) {
      toast(createToastError('Not Connected', 'Please connect to OBS first'));
      return;
    }
    try {
      const sourceName = generateSourceName(title);
      await (obsServiceInstance as ObsClient).addBrowserSource(currentProgramScene, url, sourceName, 640, 360);
      toast({ title: 'Success', description: `Added "${title}" as browser source` });
    } catch (error: any) {
      toast(createToastError('Failed to Add Source', handleAppError('Adding browser source', error)));
    }
  }, [isConnected, obsServiceInstance, currentProgramScene]);

  const handleAddAsImageSource = useCallback(async (url: string, title: string) => {
    if (!isConnected || !obsServiceInstance) {
      toast(createToastError('Not Connected', 'Please connect to OBS first'));
      return;
    }
    try {
      const sourceName = generateSourceName(title);
      await (obsServiceInstance as ObsClient).addImageSource(currentProgramScene, url, sourceName);
      toast({ title: 'Success', description: `Added "${title}" as image source` });
    } catch (error: any) {
      toast(createToastError('Failed to Add Source', handleAppError('Adding image source', error)));
    }
  }, [isConnected, obsServiceInstance, currentProgramScene]);

  // Default Modal Actions
  const getDefaultModalActions = useCallback((item: StandardApiItem): AssetModalActions[] => {
    const actions: AssetModalActions[] = [
      {
        label: 'Add as Browser Source',
        onClick: () => handleAddAsBrowserSource(item.url, item.title),
        variant: 'primary',
        icon: '🌐',
      },
      {
        label: 'Add as Image Source',
        onClick: () => handleAddAsImageSource(item.url, item.title),
        variant: 'secondary',
        icon: '🖼️',
      },
      {
        label: 'Copy URL',
        onClick: () => {
          copyToClipboard(item.url);
          toast({ title: 'Copied', description: 'URL copied to clipboard' });
        },
        variant: 'secondary',
        icon: '📋',
      },
    ];

    // Add special actions based on item type
    if (item.character) {
      actions.push({
        label: 'Copy Character',
        onClick: () => {
          copyToClipboard(item.character!);
          toast({ title: 'Copied', description: 'Character copied to clipboard' });
        },
        variant: 'secondary',
        icon: '😀',
      });
    }

    if (item.svgContent) {
      actions.push({
        label: 'Copy SVG',
        onClick: () => {
          copyToClipboard(item.svgContent!);
          toast({ title: 'Copied', description: 'SVG content copied to clipboard' });
        },
        variant: 'secondary',
        icon: '🎨',
      });
    }

    if (item.downloadUrl) {
      actions.push({
        label: 'Download',
        onClick: () => window.open(item.downloadUrl, '_blank'),
        variant: 'success',
        icon: '⬇️',
      });
    }

    return actions;
  }, [handleAddAsBrowserSource, handleAddAsImageSource]);

  // Default Grid Item Renderer
  const defaultGridRenderer = useCallback((item: StandardApiItem, onClick: () => void) => {
    if (item.character) {
      // Emoji renderer
      return (
        <div 
          key={item.id} 
          className="text-4xl flex items-center justify-center cursor-pointer bg-card hover:bg-accent rounded-md h-full transition-colors"
          onClick={onClick}
          title={item.title}
        >
          {item.character}
        </div>
      );
    }

    if (item.svgContent) {
      // SVG renderer
      return (
        <div 
          key={item.id} 
          className="relative group cursor-pointer h-full bg-card hover:bg-accent rounded-md p-2 transition-colors"
          onClick={onClick}
        >
          <div 
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: item.svgContent }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
            <p className="text-white text-xs truncate">{item.title}</p>
          </div>
        </div>
      );
    }

    // Default image renderer
    return (
      <div 
        key={item.id} 
        className="relative group cursor-pointer h-full overflow-hidden rounded-md"
        onClick={onClick}
      >
        <img 
          src={item.thumbnail} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
        />
        <div className="absolute inset-0 bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <div className="text-background text-xs">
            <p className="truncate font-medium">{item.title}</p>
            <p className="truncate text-muted-foreground">by {item.author}</p>
          </div>
        </div>
      </div>
    );
  }, []);

  // Default Modal Content Renderer
  const defaultModalRenderer = useCallback((item: StandardApiItem) => {
    if (item.character) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-9xl">{item.character}</div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-muted-foreground">{item.description}</p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (item.svgContent) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div 
            className="w-64 h-64 flex items-center justify-center bg-card rounded-lg p-4"
            dangerouslySetInnerHTML={{ __html: item.svgContent }}
          />
          <div className="text-center">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-muted-foreground">by {item.author}</p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-4">
        <img 
          src={item.url} 
          alt={item.title} 
          className="max-w-full max-h-[70vh] rounded-lg object-contain" 
        />
        <div className="text-center">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-muted-foreground">by {item.author}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
          {item.dimensions && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.dimensions.width} × {item.dimensions.height}
              {item.fileSize && ` • ${Math.round(item.fileSize / 1024)} KB`}
            </p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {item.tags.slice(0, 10).map(tag => (
                <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  const gridRenderer = customGridRenderer || defaultGridRenderer;
  const modalRenderer = customModalRenderer || defaultModalRenderer;
  const modalActions = modalContent ? (customActions?.(modalContent) || getDefaultModalActions(modalContent)) : [];

  return (
    <div className={className}>
      <CollapsibleCard 
        title={title} 
        emoji={emoji} 
        isOpen={!isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)}
      >
        <CardContent className="px-3 pb-3 pt-2">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 mb-2">
              <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search for ${title.toLowerCase()}...`}
                  className="flex-grow"
              />
              <FaviconDropdown
                  options={apiOptionsForDropdown.map(cfg => ({ label: cfg.label, value: cfg.value, domain: cfg.domain }))}
                  value={selectedApi}
                  onChange={handleApiChange}
                  className="min-w-[120px]"
              />
              <Button type="submit" disabled={loading || !query.trim()} size="sm">
                  {loading ? 'Searching...' : 'Search'}
              </Button>
          </form>

          {/* Advanced Filters Toggle */}
          {showFilters && selectedConfig && selectedConfig.supportsFilters && selectedConfig.supportsFilters.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                  <Button
                      type="button"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                  >
                      {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                  </Button>
                  {selectedConfig.requiresAuth && (
                      <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded border border-warning/20">
                          🔑 API Key Required
                      </span>
                  )}
              </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && selectedConfig && (
            <EnhancedSearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              supportedFilters={selectedConfig.supportsFilters || []}
              category={selectedConfig.category}
            />
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* Empty State */}
          {!loading && searched && mappedResults.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No results found. Try adjusting your search terms or filters.
            </div>
          )}

          {/* Results Grid */}
          {mappedResults.length > 0 && (
            <div 
              className={`grid gap-2 h-48`}
              style={{ 
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${gridRows}, 1fr)`
              }}
            >
              {mappedResults.map((item) =>
                gridRenderer(item, () => setModalContent(item))
              )}
            </div>
          )}

          {/* Results Info */}
          {mappedResults.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Showing {mappedResults.length} results from {selectedConfig?.label}
            </div>
          )}

          {/* Modal */}
          {modalContent && (
            <Modal
              isOpen={!!modalContent}
              onClose={() => setModalContent(null)}
              title={modalContent.title || 'Asset Preview'}
              actions={modalActions}
            >
              {modalRenderer(modalContent)}
            </Modal>
          )}
        </CardContent>
      </CollapsibleCard>
    </div>
  );
};

export default EnhancedAssetSearch;
