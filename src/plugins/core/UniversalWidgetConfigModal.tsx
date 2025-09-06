import React, { useState, useEffect } from 'react';
import { CollapsibleSection } from '@/components/common/CollapsibleSection';
import { WidgetTemplateSelector } from '@/features/obs-control/WidgetTemplateSelector';
import { ActionParameterMapper } from '@/features/obs-control/ActionParameterMapper';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface UniversalWidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: UniversalWidgetConfig) => void;
  currentConfig?: UniversalWidgetConfig;
  id: string;
}

const UniversalWidgetConfigModal: React.FC<UniversalWidgetConfigModalProps> = ({ isOpen, onClose, onSave, currentConfig, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);

  useEffect(() => {
    if (currentConfig) {
      setSelectedTemplate(currentConfig);
      setParameters(currentConfig.parameters || {});
    }
  }, [currentConfig]);

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setParameters(template.params || {});
  };

  const handleParameterChange = (params: Record<string, any>) => {
    setParameters(params);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      const config: UniversalWidgetConfig = {
        ...selectedTemplate,
        parameters,
      };
      onSave(config);
      updateWidgetState(id, { config });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-3 w-full max-w-md md:max-w-lg max-h-screen overflow-y-auto mx-4">
        <h3 className="text-white text-lg font-bold mb-2">Configure Widget</h3>
        <div className="mb-2">
          <WidgetTemplateSelector onSelect={handleTemplateSelect} id={id} />
        </div>
        {selectedTemplate && (
          <CollapsibleSection title="Parameters" defaultOpen={true}>
            <div className="mb-2">
              <ActionParameterMapper parameters={parameters} onChange={handleParameterChange} id={id} />
            </div>
          </CollapsibleSection>
        )}
        <CollapsibleSection title="Preview" defaultOpen={false}>
          <div className="mb-2">
            <label className="text-gray-300 text-sm mb-1 block">Preview:</label>
            <div className={`p-1 bg-gray-700 rounded ${previewVisible ? 'block' : 'hidden'}`}>
              <div className="text-white text-xs">
                Preview for {selectedTemplate?.name || 'No template selected'}
                <br />
                Parameters: {JSON.stringify(parameters)}
              </div>
              <button
                onClick={() => setPreviewVisible(!previewVisible)}
                className="mt-1 text-xs text-blue-400"
              >
                {previewVisible ? 'Hide' : 'Show'} Preview
              </button>
            </div>
          </div>
        </CollapsibleSection>
        <div className="flex space-x-1">
          <button
            onClick={handleSave}
            disabled={!selectedTemplate}
            className="flex-1 p-1.5 bg-blue-500 text-white rounded disabled:bg-gray-500 text-sm"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 p-1.5 bg-gray-500 text-white rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalWidgetConfigModal;