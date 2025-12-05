import { memo, useMemo, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { PluginRenderer } from '@/components/layout/PluginRenderer';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import GlobalErrorDisplay from '@/components/common/GlobalErrorDisplay';
import { AppInitializer } from '@/components/common/AppInitializer';
import ComprehensiveErrorBoundary from '@/components/common/ComprehensiveErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePlugins } from '@/hooks/usePlugins';
import { useTheme } from '@/hooks/useTheme';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAppLayout } from '@/hooks/useAppLayout';
import { Toaster } from 'sonner';
import { useConnectionNotifications } from '@/hooks/useConnectionNotifications';
import React from 'react';

// Separate concerns into custom hook
const useAppState = () => {
  const plugins = usePlugins();
  const layout = useAppLayout();
  const init = useAppInitialization();
  const theme = useTheme();

  return { plugins, layout, init, theme };
};

const App: React.FC = memo(() => {
  useConnectionNotifications();
  const headerRef = useRef<HTMLDivElement>(null);
  const { plugins, layout, init, theme } = useAppState();

  // Memoize expensive computations
  const activePlugin = useMemo(
    () => plugins.find((p) => p.id === layout.activeTab),
    [plugins, layout.activeTab]
  );

  const contentClasses = useMemo(
    () => `${layout.layoutClasses.content} ${layout.getContentOrderClass()}`,
    [layout.layoutClasses.content, layout.getContentOrderClass]
  );

  return (
    <ComprehensiveErrorBoundary>
      <TooltipProvider>
        <AppInitializer
          isInitialized={init.isInitialized}
          error={init.initError}
          onRetry={init.retryInit}
          stepLabel={init.stepLabel}
          progress={init.progress}
        >
          <div className={layout.layoutClasses.container}>
            <Header headerRef={headerRef} />
            <TabNavigation tabs={plugins} />
            <div className="flex flex-grow overflow-hidden">
              <div className={contentClasses}>
                <PluginRenderer plugin={activePlugin} />
              </div>
            </div>
            <ConfirmationDialog />
            <GlobalErrorDisplay />
            <Toaster
              theme={theme.theme?.type || 'system'}
              richColors
              position="bottom-right"
            />
          </div>
        </AppInitializer>
      </TooltipProvider>
    </ComprehensiveErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
