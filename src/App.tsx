// src/App.tsx - Update to handle loading state
import { memo, useMemo, useRef } from 'react';
import { Header } from '@/shared/components/layout/Header';
import { TabNavigation } from '@/shared/components/layout/TabNavigation';
import { PluginRenderer } from '@/shared/components/layout/PluginRenderer';
import ConfirmationDialog from '@/shared/components/common/ConfirmationDialog';
import GlobalErrorDisplay from '@/shared/components/common/GlobalErrorDisplay';
import { AppInitializer } from '@/shared/components/common/AppInitializer';
import ComprehensiveErrorBoundary from '@/shared/components/common/ComprehensiveErrorBoundary';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { usePlugins } from '@/shared/hooks/usePlugins';
import { useTheme } from '@/shared/hooks/useTheme';
import { useAppInitialization } from '@/shared/hooks/useAppInitialization';
import { useAppLayout } from '@/shared/hooks/useAppLayout';
import { Toaster } from 'sonner';
import { useConnectionNotifications } from '@/shared/hooks/useConnectionNotifications';
import GlobalCommandHotkeys from '@/shared/components/core/GlobalCommandHotkeys';
import React from 'react';

const App: React.FC = memo(() => {
  useConnectionNotifications();
  const headerRef = useRef<HTMLDivElement>(null);
  const { plugins, isLoading: pluginsLoading, error: pluginsError } = usePlugins();
  const layout = useAppLayout();
  const init = useAppInitialization();
  const theme = useTheme();

  // Show loading if plugins or app not ready
  if (pluginsLoading || !init.isInitialized) {
    return (
      <AppInitializer
        isInitialized={false}
        error={pluginsError || init.initError}
        onRetry={init.retryInit}
        stepLabel={pluginsLoading ? 'Loading plugins...' : init.stepLabel}
        progress={init.progress}
      />
    );
  }

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
        <div className={layout.layoutClasses.container}>
          <GlobalCommandHotkeys />
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
      </TooltipProvider>
    </ComprehensiveErrorBoundary>
  );
});

App.displayName = 'App';

export default App;