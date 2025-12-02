import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import AutomationRuleBuilder from '@/features/automation/AutomationRuleBuilder';
import { useAutomationStore } from '@/store/automationStore';
import useConnectionsStore from '@/store/connections';
import { useChatStore } from '@/store/chatStore';
import { useObsActions } from '@/hooks/useObsActions';
import { automationService } from '@/services/automationService';
import useConfigStore from '@/store/configStore';
import { AutomationRule } from '@/types/automation';
import { obsClient } from '@/services/obsClient';
import { logger } from '@/utils/logger';

const AutomationTab: React.FC = () => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get store states and actions
  const { automationRules, streamerBotServiceInstance, actions } = useAutomationStore();
  const { 
    isConnected: isObsConnected, 
    isStreamerBotConnected, 
    scenes,
    currentProgramScene,
    sources,
    streamStatus,
    recordStatus,
    videoSettings
  } = useConnectionsStore();
  const { addMessage } = useChatStore(state => state.actions);
  const automationPluginEnabled = useConfigStore(state => state.automationPluginEnabled);

  // Construct OBS data object
  const obsData = { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings };

  // Placeholder refresh function for OBS actions
  const handleRefresh = useCallback(async () => {
    logger.info('Automation tab refresh requested');
  }, []);

  // Use OBS actions hook
  const { handleObsAction } = useObsActions({
    obsClient: null as any,
    obsData,
    onRefreshData: handleRefresh,
    onAddMessage: addMessage,
    setErrorMessage
  });

  // Initialize automation service when plugin is enabled and connections are ready
  useEffect(() => {
    if (!automationPluginEnabled) {
      logger.info('Automation plugin disabled, skipping service initialization');
      return;
    }

    if (isObsConnected && isStreamerBotConnected) {
      logger.info('Initializing automation service with connections');
      automationService.initialize(
        automationRules,
        streamerBotServiceInstance,
        handleObsAction,
        addMessage
      );
      
      automationService.updateObsData(obsData);
      
      const eventListeners = [
        { event: 'CurrentProgramSceneChanged', handler: (data: any) => automationService.processEvent('CurrentProgramSceneChanged', data) },
        { event: 'StreamStateChanged', handler: (data: any) => automationService.processEvent('StreamStateChanged', data) },
        { event: 'RecordStateChanged', handler: (data: any) => automationService.processEvent('RecordStateChanged', data) },
        { event: 'InputMuteStateChanged', handler: (data: any) => automationService.processEvent('InputMuteStateChanged', data) },
        { event: 'InputActiveStateChanged', handler: (data: any) => automationService.processEvent('InputActiveStateChanged', data) },
        { event: 'SceneItemEnableStateChanged', handler: (data: any) => automationService.processEvent('SceneItemEnableStateChanged', data) },
      ];

      eventListeners.forEach(({ event, handler }) => {
        obsClient.on(event, handler);
      });

      return () => {
        eventListeners.forEach(({ event, handler }) => {
          obsClient.off(event, handler);
        });
      };
    }
  }, [automationPluginEnabled, isObsConnected, isStreamerBotConnected, automationRules, streamerBotServiceInstance, handleObsAction, addMessage, obsData]);

  useEffect(() => {
    if (automationPluginEnabled && isObsConnected) {
      automationService.updateObsData(obsData);
    }
  }, [automationPluginEnabled, isObsConnected, obsData]);

  const handleCreateRule = (eventName?: string) => {
    setEditingRule(undefined);
    setIsBuilderOpen(true);
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setIsBuilderOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this automation rule?')) {
      actions.deleteAutomationRule(ruleId);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    actions.toggleAutomationRule(ruleId);
  };

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false);
    setEditingRule(undefined);
  };

  if (!automationPluginEnabled) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 Automation Plugin Disabled
            </CardTitle>
            <CardDescription>
              The automation plugin is currently disabled. Enable it in Settings to create and manage automation rules.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isObsConnected || !isStreamerBotConnected) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Automation</h2>
            <p className="text-muted-foreground mb-4">
              Connect to OBS and Streamer.bot to use automation features.
            </p>
            <div className="text-sm text-muted-foreground">
              Automation allows you to create event-driven rules that automatically perform actions based on OBS events.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = automationService.getStatistics();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Automation</h2>
          <p className="text-muted-foreground">
            Create event-driven rules to automate your stream workflow
          </p>
        </div>
        <Button onClick={() => handleCreateRule()}>
          Create Rule
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm">
            <div className="text-center">
              <div className="font-semibold text-2xl">{stats.totalRules}</div>
              <div className="text-muted-foreground">Total Rules</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-2xl">{stats.enabledRules}</div>
              <div className="text-muted-foreground">Enabled</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-2xl">{stats.totalTriggers}</div>
              <div className="text-muted-foreground">Total Triggers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {automationRules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">No Automation Rules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automation rule to get started with automated stream workflows.
              </p>
              <Button onClick={() => handleCreateRule()}>
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          automationRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Trigger:</strong> {rule.trigger.eventName}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Conditions:</strong> {rule.conditions?.length || 0} condition(s)
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Actions:</strong> {rule.actions.length} action(s)
                    </div>
                    {rule.triggerCount && rule.triggerCount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Triggered:</strong> {rule.triggerCount} time(s)
                        {rule.lastTriggered && (
                          <span className="ml-2">
                            (Last: {new Date(rule.lastTriggered).toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Quick Start</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCreateRule('CurrentProgramSceneChanged')}
            >
              🎬 Scene Change Rule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCreateRule('StreamStateChanged')}
            >
              📡 Stream State Rule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCreateRule('RecordStateChanged')}
            >
              📹 Record State Rule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCreateRule('InputMuteStateChanged')}
            >
              🎤 Mute State Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      <AutomationRuleBuilder
        isOpen={isBuilderOpen}
        onClose={handleCloseBuilder}
        editingRule={editingRule}
      />
    </div>
  );
};

export default AutomationTab;