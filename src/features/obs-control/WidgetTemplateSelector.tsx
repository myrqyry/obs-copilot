import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/app/store/widgetsStore';
import type { UniversalWidgetConfig } from '@/shared/types/universalWidget';

interface WidgetTemplate {
  name: string;
  category: string;
  params: Record<string, any>;
}

interface WidgetTemplateSelectorProps extends UniversalWidgetConfig {
  onSelect: (template: WidgetTemplate) => void;
  id: string;
  className?: string;
}

const WidgetTemplateSelector: React.FC<WidgetTemplateSelectorProps> = ({ onSelect, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [templates, setTemplates] = useState<WidgetTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Load templates from config - assume they are imported or fetched
    const allTemplates: WidgetTemplate[] = [
      { name: 'Audio Volume', category: 'audio', params: { min: -60, max: 0 } },
      { name: 'Scene Switcher', category: 'scene', params: { showItems: true } },
      { name: 'Transform', category: 'transform', params: { position: true, scale: true } },
      { name: 'Visibility', category: 'visibility', params: { animation: true } },
      // Add more templates as needed
    ];
    setTemplates(allTemplates);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: WidgetTemplate) => {
    onSelect(template);
    updateWidgetState(id, { value: template });
  };

  const categories = ['all', 'audio', 'scene', 'transform', 'visibility'];

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Widget Template Selector</h3>
      <input
        type="text"
        placeholder="Search templates..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-2 bg-gray-700 text-white rounded"
      />
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredTemplates.map((template, index) => (
          <div key={index} className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600" onClick={() => handleSelect(template)}>
            <div className="text-white text-sm">{template.name}</div>
            <div className="text-gray-300 text-xs">{template.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetTemplateSelector;