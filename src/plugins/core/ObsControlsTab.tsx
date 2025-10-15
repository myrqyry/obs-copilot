import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Plus, Settings, Save, Download, Upload, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui';
import useConnectionsStore from '@/store/connectionsStore';
import useWidgetStore from '@/features/obs-control/widgetStore';
import UniversalWidgetEngine from '@/features/obs-control/UniversalWidgetEngine';
import { WidgetPalette } from './components/WidgetPalette';
import { WidgetConfigPanel } from './components/WidgetConfigPanel';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ObsControlsTabProps {}

const ObsControlsTab: React.FC<ObsControlsTabProps> = () => {
  const { obsStatus } = useConnectionsStore(state => ({ obsStatus: state.obsStatus }));
  const {
    widgets,
    widgetGroups,
    layouts,
    selectedWidgetId,
    registerWidget,
    selectWidget,
    createWidgetGroup,
    updateWidgetGroup,
    setLayouts,
  } = useWidgetStore();

  const handleExport = () => {
    const state = useWidgetStore.getState();
    const serializableState = {
      widgets: Array.from(state.widgets.entries()),
      widgetGroups: state.widgetGroups,
      layouts: state.layouts,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serializableState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dashboard-layout.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedState = JSON.parse(e.target?.result as string);
          const { widgets, widgetGroups, layouts } = importedState;
          useWidgetStore.setState({
            widgets: new Map(widgets),
            widgetGroups,
            layouts,
          });
        } catch (error) {
          console.error("Error importing layout:", error);
          // Optionally, show an error to the user
        }
      };
      reader.readAsText(file);
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPalette, setShowPalette] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('default');

  // Memoized widget list for performance
  const widgetList = useMemo(() => {
    return Array.from(widgets.values());
  }, [widgets]);

  // Get widgets for current group
  const currentGroupWidgets = useMemo(() => {
    const group = widgetGroups.find(g => g.id === activeGroup);
    if (!group) return widgetList;

    return widgetList.filter(widget =>
      group.widgetIds.includes(widget.config.id)
    );
  }, [widgetList, widgetGroups, activeGroup]);

  // Handle layout change
  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
  }, [setLayouts]);

  // Handle widget selection
  const handleWidgetSelect = useCallback((widgetId: string) => {
    selectWidget(selectedWidgetId === widgetId ? null : widgetId);
    setShowConfig(true);
  }, [selectedWidgetId, selectWidget]);

  // Handle adding new widget
  const handleAddWidget = useCallback((widgetConfig: UniversalWidgetConfig) => {
    registerWidget(widgetConfig);
    setShowPalette(false);
  }, [registerWidget]);

  // Connection status indicator
  if (obsStatus !== 'connected') {
    const messages = {
      disconnected: { title: 'OBS Disconnected', message: 'Connect to OBS Studio to start using controls.', variant: 'destructive' },
      connecting: { title: 'Connecting to OBS...', message: 'Please wait while we establish a connection.', variant: 'default' },
      reconnecting: { title: 'Reconnecting to OBS...', message: 'Connection was lost. Trying to reconnect.', variant: 'default' },
      error: { title: 'OBS Connection Error', message: 'Could not connect to OBS. Please check your settings.', variant: 'destructive' },
    };
    const { title, message, variant } = messages[obsStatus];

    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{message}</p>
            <Badge variant={variant as any}>{obsStatus.charAt(0).toUpperCase() + obsStatus.slice(1)}</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Controls Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">OBS Controls</h2>
            <Badge variant="secondary">{currentGroupWidgets.length} widgets</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPalette(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              disabled={!selectedWidgetId}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="import-layout">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <input type="file" id="import-layout" className="hidden" onChange={handleImport} accept=".json" />
              </label>
            </Button>
          </div>
        </div>

        {/* Groups Tabs */}
        <Tabs value={activeGroup} onValueChange={setActiveGroup} className="border-b">
          <TabsList className="w-full justify-start bg-transparent p-0">
            {widgetGroups.map(group => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="data-[state=active]:bg-white data-[state=active]:border-b-2"
              >
                {group.name}
                <Badge variant="secondary" className="ml-2">
                  {group.widgetIds.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Widget Grid */}
        <div className="flex-1 p-4 overflow-auto">
          {viewMode === 'grid' ? (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              onLayoutChange={handleLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={80}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              isDraggable={true}
              isResizable={true}
              compactType="vertical"
              preventCollision={false}
            >
              {currentGroupWidgets.map(widget => (
                <div
                  key={widget.config.id}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                    selectedWidgetId === widget.config.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleWidgetSelect(widget.config.id)}
                >
                  <div className="h-full p-2">
                    <UniversalWidgetEngine
                      config={widget.config}
                      onUpdate={(id, value) => console.log('Widget updated:', id, value)}
                    />
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          ) : (
            <div className="space-y-4">
              {currentGroupWidgets.map(widget => (
                <Card
                  key={widget.config.id}
                  className={`cursor-pointer transition-all ${
                    selectedWidgetId === widget.config.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleWidgetSelect(widget.config.id)}
                >
                  <CardContent className="p-4">
                    <UniversalWidgetEngine
                      config={widget.config}
                      onUpdate={(id, value) => console.log('Widget updated:', id, value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Widget Palette Sidebar */}
      {showPalette && (
        <WidgetPalette
          onAddWidget={handleAddWidget}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* Configuration Panel */}
      {showConfig && selectedWidgetId && (
        <WidgetConfigPanel
          widgetId={selectedWidgetId}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
};

export default ObsControlsTab;