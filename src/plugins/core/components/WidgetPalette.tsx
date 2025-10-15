import React, { useState, useCallback } from 'react';
import { X, Search, Sliders, ToggleLeft, Volume2, Palette, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UniversalWidgetConfig, WidgetControlType } from '@/types/universalWidget';
import useConnectionsStore from '@/store/connectionsStore';

interface WidgetPaletteProps {
  onAddWidget: (config: UniversalWidgetConfig) => void;
  onClose: () => void;
}

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  controlType: WidgetControlType;
  category: string;
  obsProperty?: string;
  defaultConfig?: Partial<UniversalWidgetConfig>;
}

const widgetTemplates: WidgetTemplate[] = [
  // Audio Controls
  {
    id: 'master-volume',
    name: 'Master Volume',
    description: 'Control OBS master audio volume',
    icon: <Volume2 className="w-5 h-5" />,
    controlType: WidgetControlType.SLIDER,
    category: 'Audio',
    obsProperty: 'audio.master.volume',
    defaultConfig: {
      valueMapping: { min: 0, max: 100, step: 1 },
      obsConfig: {
        obsRequest: 'SetInputVolume',
        obsParams: { inputName: 'Desktop Audio', inputVolumeMul: '$value' }
      }
    }
  },
  {
    id: 'mic-volume',
    name: 'Microphone Volume',
    description: 'Control microphone input volume',
    icon: <Volume2 className="w-5 h-5" />,
    controlType: WidgetControlType.KNOB,
    category: 'Audio',
    obsProperty: 'audio.mic.volume',
    defaultConfig: {
      valueMapping: { min: 0, max: 100, step: 1 },
      obsConfig: {
        obsRequest: 'SetInputVolume',
        obsParams: { inputName: 'Mic/Aux', inputVolumeMul: '$value' }
      }
    }
  },
  {
    id: 'audio-mute',
    name: 'Microphone Mute',
    description: 'Toggle microphone mute',
    icon: <ToggleLeft className="w-5 h-5" />,
    controlType: WidgetControlType.SWITCH,
    category: 'Audio',
    obsProperty: 'audio.mic.muted',
    defaultConfig: {
      obsConfig: {
        obsRequest: 'SetInputMute',
        obsParams: { inputName: 'Mic/Aux', inputMuted: '$value' }
      }
    }
  },

  // Scene Controls
  {
    id: 'scene-switcher',
    name: 'Scene Switcher',
    description: 'Quick scene switching buttons',
    icon: <Monitor className="w-5 h-5" />,
    controlType: WidgetControlType.PICKER,
    category: 'Scenes',
    obsProperty: 'scenes.current',
    defaultConfig: {
      obsConfig: {
        obsRequest: 'SetCurrentProgramScene',
        obsParams: { sceneName: '$value' }
      }
    }
  },

  // Filters & Effects
  {
    id: 'brightness',
    name: 'Brightness',
    description: 'Adjust video source brightness',
    icon: <Sliders className="w-5 h-5" />,
    controlType: WidgetControlType.SLIDER,
    category: 'Video',
    obsProperty: 'filters.brightness',
    defaultConfig: {
      valueMapping: { min: -100, max: 100, step: 5 },
      obsConfig: {
        obsRequest: 'SetSourceFilterSettings',
        obsParams: {
          sourceName: '$sourceName',
          filterName: 'Color Correction',
          filterSettings: { brightness: '$value' }
        }
      }
    }
  },
  {
    id: 'contrast',
    name: 'Contrast',
    description: 'Adjust video source contrast',
    icon: <Sliders className="w-5 h-5" />,
    controlType: WidgetControlType.KNOB,
    category: 'Video',
    obsProperty: 'filters.contrast',
    defaultConfig: {
      valueMapping: { min: -100, max: 100, step: 5 },
      obsConfig: {
        obsRequest: 'SetSourceFilterSettings',
        obsParams: {
          sourceName: '$sourceName',
          filterName: 'Color Correction',
          filterSettings: { contrast: '$value' }
        }
      }
    }
  },
  {
    id: 'hue-shift',
    name: 'Hue Shift',
    description: 'Adjust color hue',
    icon: <Palette className="w-5 h-5" />,
    controlType: WidgetControlType.KNOB,
    category: 'Video',
    obsProperty: 'filters.hue',
    defaultConfig: {
      valueMapping: { min: -180, max: 180, step: 1 },
      obsConfig: {
        obsRequest: 'SetSourceFilterSettings',
        obsParams: {
          sourceName: '$sourceName',
          filterName: 'Color Correction',
          filterSettings: { hue_shift: '$value' }
        }
      }
    }
  }
];

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({ onAddWidget, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { sources, scenes } = useConnectionsStore(state => ({
    sources: state.sources,
    scenes: state.scenes
  }));

  const categories = ['All', ...Array.from(new Set(widgetTemplates.map(t => t.category)))];

  const filteredTemplates = widgetTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddWidget = useCallback((template: WidgetTemplate) => {
    const config: UniversalWidgetConfig = {
      id: `${template.id}-${Date.now()}`,
      name: template.name,
      controlType: template.controlType,
      obsConfig: template.defaultConfig?.obsConfig || {
        obsRequest: 'GetVersion',
        obsParams: {}
      },
      valueMapping: template.defaultConfig?.valueMapping || {},
      visualConfig: {
        showLabel: true,
        color: 'blue',
        size: 'medium'
      },
      state: {
        value: 0,
        isActive: true,
        lastUpdated: Date.now()
      },
      metadata: {
        category: template.category,
        description: template.description,
        createdAt: Date.now(),
        version: '1.0.0'
      },
      ...template.defaultConfig
    };

    onAddWidget(config);
  }, [onAddWidget]);

  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Widget Palette</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Widget Templates */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleAddWidget(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" size="sm">
                        {template.controlType}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Add Section */}
      <div className="p-4 border-t bg-gray-50">
        <h4 className="font-medium mb-3">Quick Add</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleAddWidget(widgetTemplates[0])}
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Volume Slider
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleAddWidget(widgetTemplates[1])}
          >
            <ToggleLeft className="w-4 h-4 mr-2" />
            Toggle Switch
          </Button>
        </div>
      </div>
    </div>
  );
};