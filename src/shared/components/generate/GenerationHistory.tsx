import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Badge } from '@/shared/components/ui/badge';
import { useGenerateStore } from '@/app/store/generateStore';
import { X, Download, Trash2, Image, Mic } from 'lucide-react';

interface GenerationHistoryProps {
  onClose: () => void;
  onClear: () => void;
  onExport: () => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  onClose,
  onClear,
  onExport,
}) => {
  const { generationHistory, removeFromHistory } = useGenerateStore();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'speech':
        return <Mic className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-96 bg-card border-l flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-bold">Generation History</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {generationHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p>Your generated content will appear here.</p>
            </div>
          ) : (
            generationHistory.map((item) => (
              <div key={item.id} className="bg-muted/10 p-3 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getIconForType(item.type)}
                      <Badge variant="secondary">{item.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate w-60">
                      {item.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => removeFromHistory(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {item.type === 'image' && item.result.images?.[0] && (
                  <img
                    src={`data:${item.result.images[0].mime_type};base64,${item.result.images[0].data}`}
                    alt="Generated"
                    className="mt-2 rounded-md aspect-video object-cover"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <Button variant="outline" className="w-full" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export History
        </Button>
        <Button variant="destructive" className="w-full" onClick={onClear}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear History
        </Button>
      </div>
    </div>
  );
};