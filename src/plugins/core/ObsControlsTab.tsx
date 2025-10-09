import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Plus, Settings, Save, Download, Upload, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import useConnectionsStore from '@/store/connectionsStore';
import useWidgetStore, { useWidgetSelection } from '@/features/obs-control/widgetStore';
import UniversalWidgetEngine from '@/features/obs-control/UniversalWidgetEngine';
import { WidgetPalette } from './components/WidgetPalette';
import { WidgetConfigPanel } from './components/WidgetConfigPanel';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ObsControlsTabProps {}

const ObsControlsTab: React.FC<ObsControlsTabProps> = () => {
  const { isConnected } = useConnectionsStore(state => ({ isConnected: state.isConnected }));
  const {
    widgets,
    widgetGroups,
    selectedWidgetId,
    registerWidget,
    selectWidget,
    createWidgetGroup,
    updateWidgetGroup
  } = useWidgetStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPalette, setShowPalette] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: []
  });
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
    // Save layout to local storage or backend
    localStorage.setItem('obs-controls-layout', JSON.stringify(allLayouts));
  }, []);

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
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">OBS Not Connected</h3>
            <p className="text-gray-600 mb-4">
              Connect to OBS Studio to start using controls
            </p>
            <Badge variant="destructive">Disconnected</Badge>
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