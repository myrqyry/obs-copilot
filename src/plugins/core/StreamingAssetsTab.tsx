import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AssetSearchTab from '@/components/asset-search/EnhancedAssetSearch'; // Updated path based on project structure
import { useOverlayGeneration } from '@/hooks/useOverlayGeneration';
import { overlayTemplates } from '@/config/overlayTemplates';
import OverlayPreview from '@/components/OverlayPreview';

const StreamingAssetsTab: React.FC = () => {
  // Use hook unconditionally
  const {
    selectedTemplate,
    setSelectedTemplate,
    description,
    setDescription,
    generateOverlay,
    isLoading,
    currentOverlay
  } = useOverlayGeneration();

  const handleGenerate = async () => {
    if (selectedTemplate && description.trim()) {
      await generateOverlay(selectedTemplate, description);
    }
  };

  const availableTemplates = overlayTemplates.getAvailableTemplates(); // Assuming this method exists

  return (
    <div className="space-y-6 p-4">
      {/* Existing Asset Search Section */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Asset Search</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetSearchTab />
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
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
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
