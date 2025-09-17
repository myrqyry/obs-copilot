import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { EnhancedAssetSearch } from '@/components/asset-search/EnhancedAssetSearch';
import { getAllAssetConfigs } from '@/config/assetSearchConfigs';
import { useOverlaysStore } from '@/store/overlaysStore';
import { overlayTemplates } from '@/config/overlayTemplates';
import OverlayPreview from '@/components/OverlayPreview';

const StreamingAssetsTab: React.FC = () => {
  // Manage selection and description locally; use overlays store for generation and current overlays
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const generateOverlay = useOverlaysStore((s) => s.generateOverlay);
  const isLoading = useOverlaysStore((s) => s.loading);
  const overlays = useOverlaysStore((s) => s.overlays);
  const currentOverlay = overlays && overlays.length > 0 ? overlays[overlays.length - 1] : undefined;

  const handleGenerate = async () => {
    if (selectedTemplate && description.trim()) {
      await generateOverlay(selectedTemplate, description);
    }
  };

  // overlayTemplates exports an array of templates — use it directly
  const availableTemplates = Array.isArray(overlayTemplates) ? overlayTemplates : [];

  return (
    <div className="space-y-6 p-4">
      {/* Existing Asset Search Section */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Asset Search</CardTitle>
        </CardHeader>
          <CardContent>
          <EnhancedAssetSearch title="Asset Search" emoji="🔎" apiConfigs={getAllAssetConfigs()} />
        </CardContent>
      </Card>

      {/* New Overlay Generator Section */}
      <Card className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Overlay Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Template
                </label>
                <Select value={selectedTemplate || ''} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.templateName} value={template.templateName}>
                        {template.templateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your overlay (e.g., 'A modern chat overlay with animated messages and viewer count')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !selectedTemplate || !description.trim()}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Overlay'}
              </Button>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Preview
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 h-64 flex items-center justify-center">
                {currentOverlay ? (
                  <OverlayPreview config={currentOverlay} width={300} height={200} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    Select a template and describe your overlay to generate a preview.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamingAssetsTab;
