import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Download, ExternalLink, Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/use-toast';
import { StandardApiItem } from '@/types/assetSearch';
import { copyToClipboard } from '@/lib/utils';

interface AssetGridProps {
  items: StandardApiItem[];
  columns: number;
  rows: number;
  onAddToOBS?: (item: StandardApiItem, sourceType: 'image' | 'browser') => void;
}

interface AssetItemProps {
  item: StandardApiItem;
  onClick: () => void;
  className?: string;
}

const AssetThumbnail: React.FC<AssetItemProps> = ({ item, onClick, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Handle different asset types
  if (item.character) {
    // Emoji display
    return (
      <motion.div
        className={`group cursor-pointer bg-white hover:bg-gray-50 rounded-lg shadow-sm border-2 border-transparent hover:border-blue-300 transition-all duration-200 ${className}`}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="text-4xl mb-2">{item.character}</div>
          <div className="text-xs text-gray-600 text-center font-medium truncate w-full">
            {item.title}
          </div>
        </div>
      </motion.div>
    );
  }

  if (item.svgContent) {
    // SVG display
    return (
      <motion.div
        className={`group cursor-pointer bg-white hover:bg-gray-50 rounded-lg shadow-sm border-2 border-transparent hover:border-blue-300 transition-all duration-200 ${className}`}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="h-full p-3 flex flex-col">
          <div
            className="flex-1 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: item.svgContent }}
          />
          <div className="text-xs text-gray-600 text-center font-medium truncate mt-2">
            {item.title}
          </div>
        </div>
      </motion.div>
    );
  }

  // Image/GIF display
  return (
    <motion.div
      className={`group cursor-pointer rounded-lg shadow-sm border-2 border-transparent hover:border-blue-300 transition-all duration-200 overflow-hidden ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative h-full">
        {/* Loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        )}

        {/* Error placeholder */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Failed to load</div>
          </div>
        )}

        {/* Image */}
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ opacity: imageLoaded && !imageError ? 1 : 0 }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <div className="text-white">
            <div className="text-sm font-medium truncate">{item.title}</div>
            {item.author && (
              <div className="text-xs opacity-75 truncate">by {item.author}</div>
            )}
          </div>
        </div>

        {/* Format badge */}
        {item.format && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="text-xs bg-black/60 text-white border-0"
            >
              {item.format.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* GIF play indicator */}
        {item.format === 'gif' && (
          <div className="absolute top-2 left-2">
            <div className="bg-black/60 rounded-full p-1">
              <Play className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {/* Dimensions indicator */}
        {item.dimensions && (item.dimensions.width > 0 || item.dimensions.height > 0) && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="text-xs bg-black/60 text-white border-0"
            >
              {item.dimensions.width}×{item.dimensions.height}
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AssetModal: React.FC<{
  item: StandardApiItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToOBS?: (item: StandardApiItem, sourceType: 'image' | 'browser') => void;
}> = ({ item, isOpen, onClose, onAddToOBS }) => {
  if (!item) return null;

  const handleCopyUrl = useCallback(() => {
    copyToClipboard(item.url);
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
      variant: 'default'
    });
  }, [item.url]);

  const handleCopyCharacter = useCallback(() => {
    if (item.character) {
      copyToClipboard(item.character);
      toast({
        title: 'Copied',
        description: 'Character copied to clipboard',
        variant: 'default'
      });
    }
  }, [item.character]);

  const handleDownload = useCallback(() => {
    if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank');
    } else {
      window.open(item.url, '_blank');
    }
  }, [item.downloadUrl, item.url]);

  const actions = useMemo(() => {
    const baseActions = [
      {
        label: 'Copy URL',
        onClick: handleCopyUrl,
        variant: 'outline' as const,
        icon: <Copy className="w-4 h-4" />
      }
    ];

    if (item.character) {
      baseActions.unshift({
        label: 'Copy Character',
        onClick: handleCopyCharacter,
        variant: 'default' as const,
        icon: <Copy className="w-4 h-4" />
      });
    }

    if (onAddToOBS) {
      baseActions.unshift(
        {
          label: 'Add as Image Source',
          onClick: () => onAddToOBS(item, 'image'),
          variant: 'default' as const,
          icon: <Plus className="w-4 h-4" />
        },
        {
          label: 'Add as Browser Source',
          onClick: () => onAddToOBS(item, 'browser'),
          variant: 'outline' as const,
          icon: <Plus className="w-4 h-4" />
        }
      );
    }

    if (item.downloadUrl || (!item.character && !item.svgContent)) {
      baseActions.push({
        label: 'Download',
        onClick: handleDownload,
        variant: 'outline' as const,
        icon: <Download className="w-4 h-4" />
      });
    }

    return baseActions;
  }, [item, onAddToOBS, handleCopyUrl, handleCopyCharacter, handleDownload]);

  const renderContent = () => {
    if (item.character) {
      return (
        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="text-8xl">{item.character}</div>
          <div className="text-center">
            <h3 className="text-xl font-semibold">{item.title}</h3>
            {item.description && (
              <p className="text-gray-600 mt-1">{item.description}</p>
            )}
          </div>
        </div>
      );
    }

    if (item.svgContent) {
      return (
        <div className="flex flex-col items-center space-y-4 p-6">
          <div
            className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg"
            dangerouslySetInnerHTML={{ __html: item.svgContent }}
          />
          <div className="text-center">
            <h3 className="text-xl font-semibold">{item.title}</h3>
            {item.author && (
              <p className="text-gray-600">by {item.author}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="max-w-full max-h-[70vh] overflow-hidden rounded-lg">
          <img
            src={item.url}
            alt={item.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="text-center px-4">
          <h3 className="text-xl font-semibold">{item.title}</h3>
          {item.author && (
            <p className="text-gray-600">by {item.author}</p>
          )}
          {item.description && (
            <p className="text-sm text-gray-500 mt-2 max-w-md">{item.description}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-500">
            {item.dimensions && (item.dimensions.width > 0 || item.dimensions.height > 0) && (
              <span>{item.dimensions.width} × {item.dimensions.height}</span>
            )}
            {item.fileSize && (
              <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
            )}
            {item.format && (
              <span>{item.format.toUpperCase()}</span>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {item.tags.slice(0, 8).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      actions={actions}
      size="lg"
    >
      {renderContent()}
    </Modal>
  );
};

export const AssetGrid: React.FC<AssetGridProps> = ({
  items,
  columns,
  rows,
  onAddToOBS
}) => {
  const [selectedItem, setSelectedItem] = useState<StandardApiItem | null>(null);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: '12px',
    height: '400px'
  };

  return (
    <>
      <motion.div
        style={gridStyle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {items.slice(0, columns * rows).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <AssetThumbnail
                item={item}
                onClick={() => setSelectedItem(item)}
                className="h-full"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AssetModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToOBS={onAddToOBS}
      />
    </>
  );
};