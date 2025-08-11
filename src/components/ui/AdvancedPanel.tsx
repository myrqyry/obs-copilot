import Tooltip from '@/components/ui/Tooltip';
import React, { useState, useEffect } from 'react';
import AudioOutputSelector from '@/components/ui/AudioOutputSelector';
import { OBS_EVENT_LIST } from '@/constants/obsEvents';
import { useAutomationStore } from '@/store/automationStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/Button';
import { CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { AddToContextButton } from '@/components/common/AddToContextButton';
import AutomationRuleBuilder from '@/features/automation/AutomationRuleBuilder';
import { automationService } from '@/services/automationService';
import type { AutomationRule } from '@/types/automation';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '@/types';
import useApiKeyStore, { ApiService, ApiServiceName } from '@/store/apiKeyStore';

// Defines the services shown in the UI for API key input
const PANEL_API_KEY_SERVICES: { id: ApiServiceName; label: string; optional?: boolean }[] = [
    { id: ApiService.GEMINI, label: 'Gemini', optional: false },
    { id: ApiService.CHUTES, label: 'Chutes', optional: false },
    { id: ApiService.GIPHY, label: 'Giphy', optional: true },
    { id: ApiService.IMGUR, label: 'Imgur', optional: true },
    { id: ApiService.PEXELS, label: 'Pexels', optional: true },
    { id: ApiService.PIXABAY, label: 'Pixabay', optional: true },
    { id: ApiService.ICONFINDER, label: 'Iconfinder', optional: true },
    { id: ApiService.DEVIANTART, label: 'DeviantArt', optional: true },
    { id: ApiService.IMGFLIP, label: 'Imgflip', optional: true },
    { id: ApiService.TENOR, label: 'Tenor', optional: true },
    { id: ApiService.WALLHAVEN, label: 'Wallhaven', optional: true },
    { id: ApiService.OPENEMOJI, label: 'OpenEmoji (Generic)', optional: true },
    { id: ApiService.UNSPLASH, label: 'Unsplash', optional: true },
];


const OBS_SUBSCRIPTIONS_KEY = 'obsEventSubscriptions';

const AdvancedPanel: React.FC = () => {
    // API Key Store
    const overrides = useApiKeyStore((state) => state.overrides);
    const setApiKey = useApiKeyStore((state) => state.setApiKey);
    const clearApiKey = useApiKeyStore((state) => state.clearApiKey);
    const getAllOverrides = useApiKeyStore((state) => state.getAllOverrides);
    // Local state for input fields, to avoid updating Zustand on every keystroke
    const [localApiKeyInputs, setLocalApiKeyInputs] = useState<Partial<Record<ApiServiceName, string>>>({});
    // Local state for API key input visibility (true = show text, false = hide with password type)
    const [showApiKey, setShowApiKey] = useState<Partial<Record<ApiServiceName, boolean>>>({});

    // Initialize local inputs when component mounts or overrides change
    useEffect(() => {
        setLocalApiKeyInputs(getAllOverrides());
    }, [overrides, getAllOverrides]);


    // Automation Rules State
    const automationRules = useAutomationStore((state) => state.automationRules);
    const {
        deleteAutomationRule,
        toggleAutomationRule,
    } = useAutomationStore((state) => state.actions);
    const { actions: obsActions, obsServiceInstance, streamerBotServiceInstance } = useConnectionManagerStore();
    const { uploadLog } = obsActions;
    const [obsLogFiles, setObsLogFiles] = useState<any[] | null>(null);
    
    const [openAutomation, setOpenAutomation] = useState(false);
    const [openAudio, setOpenAudio] = useState(false);
    const [showRuleBuilder, setShowRuleBuilder] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
    const [ruleBuilderInitialEvent, setRuleBuilderInitialEvent] = useState<string | undefined>();

    // OBS Event Subscriptions State
    const [openObsEvents, setOpenObsEvents] = useState(false);
    const [openLogs, setOpenLogs] = useState(false);
    const [isUploadingLog, setIsUploadingLog] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; url?: string; message: string } | null>(null);
    const [obsEventSubscriptions, setObsEventSubscriptions] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(OBS_SUBSCRIPTIONS_KEY);
            if (stored) return JSON.parse(stored);
        } catch { }
        return [];
    });

    useEffect(() => {
        try {
            localStorage.setItem(OBS_SUBSCRIPTIONS_KEY, JSON.stringify(obsEventSubscriptions));
        } catch { }
    }, [obsEventSubscriptions]);

    const handleObsEventToggle = (eventName: string) => {
        setObsEventSubscriptions((prev) =>
            prev.includes(eventName)
                ? prev.filter((e) => e !== eventName)
                : [...prev, eventName]
        );
    };
    const userDefinedContext = useChatStore((state) => state.userDefinedContext);
    const chatActions = useChatStore((state) => state.actions);
    const { addToUserDefinedContext, removeFromUserDefinedContext, clearUserDefinedContext } = chatActions;
    const [userInput, setUserInput] = useState('');
    const [openMemory, setOpenMemory] = useState(true);
    const [openReset, setOpenReset] = useState(false);
    const [openApiKeys, setOpenApiKeys] = useState(false);

    // Get the addMessage action from the store
    const { addMessage } = chatActions;


    const handleApiKeyInputChange = (service: ApiServiceName, value: string) => {
        setLocalApiKeyInputs((prev) => ({ ...prev, [service]: value }));
    };

    const handleApiKeySave = (service: ApiServiceName) => {
        const valueToSave = localApiKeyInputs[service]?.trim();
        if (valueToSave) {
            setApiKey(service, valueToSave);
        } else {
            // If input is empty, consider it as clearing the override
            clearApiKey(service);
        }
    };

    const handleApiKeyRemove = (service: ApiServiceName) => {
        clearApiKey(service);
        setLocalApiKeyInputs((prev) => {
            const newInputs = { ...prev };
            delete newInputs[service];
            return newInputs;
        });
    };

    // Reset settings logic (matches ObsSettingsPanel)
    const handleResetAllSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to defaults? This will clear your saved connection details, theme preferences, and other settings.')) {
            import('@/utils/persistence').then(({ clearAllSettings }) => {
                clearAllSettings();
                window.location.reload();
            });
        }
    };

    // Initialize automation service when services are available
    useEffect(() => {
        if (obsServiceInstance || streamerBotServiceInstance) {
            automationService.initialize(
                automationRules,
                streamerBotServiceInstance,
                obsActions.handleObsAction,
                addMessage
            );
        }
    }, [obsServiceInstance, streamerBotServiceInstance, automationRules, obsActions.handleObsAction, addMessage]);

    // Wire up event subscriptions when obsServiceInstance or obsEventSubscriptions change
    useEffect(() => {
        if (!obsServiceInstance) return;
        // Build handlers for all checked events
        const handlers: Record<string, (...args: any[]) => void> = {};
        obsEventSubscriptions.forEach(eventName => {
            handlers[eventName] = (event) => {
                // Send a system message to the chat when the event occurs
                addMessage({
                    role: 'system',
                    text: `OBS Event: **${eventName}**\n\n\`\`\`json\n${JSON.stringify(event, null, 2)}\n\`\`\``,
                });

                // Process automation rules for this event
                automationService.processEvent(eventName, event);
            };
        });

        const unsubscribe =
            typeof obsServiceInstance.subscribeToEvents === 'function'
                ? obsServiceInstance.subscribeToEvents(handlers)
                : undefined;

        return () => {
            try {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                } else if (typeof (obsServiceInstance as any).unsubscribeFromEvents === 'function') {
                    (obsServiceInstance as any).unsubscribeFromEvents(handlers);
                }
            } catch (e) {
                console.error('Failed to unsubscribe from OBS events', e);
            }
        };
    }, [obsServiceInstance, obsEventSubscriptions, addMessage]);

    // Automation rule handlers
    const handleCreateRule = (eventName?: string) => {
        setRuleBuilderInitialEvent(eventName);
        setEditingRule(null);
        setShowRuleBuilder(true);
    };

    const handleEditRule = (rule: AutomationRule) => {
        setEditingRule(rule);
        setRuleBuilderInitialEvent(undefined);
        setShowRuleBuilder(true);
    };

    const handleDeleteRule = (ruleId: string) => {
        if (window.confirm('Are you sure you want to delete this automation rule?')) {
            deleteAutomationRule(ruleId);
        }
    };

    const handleCloseRuleBuilder = () => {
        setShowRuleBuilder(false);
        setEditingRule(null);
        setRuleBuilderInitialEvent(undefined);
    };

    // Get automation statistics
    const automationStats = automationService.getStatistics();

    // Get accent color hex from Zustand
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || '#89b4fa';

    return (
        <div className="space-y-2 max-w-2xl mx-auto p-0">
            {/* Memory Context Section */}
            <CollapsibleCard
                title="Memory Context"
                emoji="🧠"
                isOpen={openMemory}
                onToggle={() => setOpenMemory((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Add custom context that will be included with all Gemini conversations. Great for streaming details, community info, or personal preferences.
                        </p>
                        <div className="flex gap-2">
                            <input
                                className="w-full border rounded p-2 bg-background"
                                value={userInput}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
                                placeholder="Enter stream/community details"
                            />
                            <Button
                                onClick={() => {
                                    if (userInput.trim()) {
                                        addToUserDefinedContext(userInput.trim());
                                        setUserInput('');
                                    }
                                }}
                                disabled={!userInput.trim()}
                                size="sm"
                            >
                                Add
                            </Button>
                        </div>
                        {userDefinedContext.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-primary">Current Context:</label>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {userDefinedContext.map((context, index) => (
                                        <div key={index} className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded text-sm">
                                            <span className="text-foreground flex-1 mr-2">{context}</span>
                                            <Button
                                                onClick={() => removeFromUserDefinedContext(context)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to clear all memory context?')) {
                                            clearUserDefinedContext();
                                        }
                                    }}
                                    variant="secondary"
                                    size="sm"
                                >
                                    Clear All Context
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </CollapsibleCard>

            {/* Automation Rules Section */}
            <CollapsibleCard
                title="Automation Rules"
                emoji="🤖"
                isOpen={openAutomation}
                onToggle={() => setOpenAutomation((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Create automated responses to OBS events. Rules can trigger OBS actions or Streamer.bot actions when specific events occur.
                            </p>
                            <Button onClick={() => handleCreateRule()} size="sm">
                                Create Rule
                            </Button>
                        </div>

                        {automationStats.totalTriggers > 0 && (
                            <div className="text-xs text-muted-foreground">
                                📊 Total triggers: {automationStats.totalTriggers}
                            </div>
                        )}

                        {automationRules.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="mb-2">No automation rules created yet.</p>
                                <Button onClick={() => handleCreateRule()} size="sm" variant="secondary">
                                    Create Your First Rule
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {automationRules.map((rule) => (
                                    <div key={rule.id} className="border rounded p-3 bg-muted/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    rule.enabled ? "bg-green-500" : "bg-gray-400"
                                                )} />
                                                <span className="text-sm font-medium text-foreground">
                                                    {rule.name}
                                                </span>
                                                {rule.triggerCount && rule.triggerCount > 0 && (
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                                        {rule.triggerCount} triggers
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Tooltip content={rule.enabled ? 'Disable rule' : 'Enable rule'}>
                                                    <button
                                                        onClick={() => toggleAutomationRule(rule.id)}
                                                        className={cn(
                                                            "w-6 h-6 rounded text-xs transition-colors",
                                                            rule.enabled
                                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                        )}
                                                    >
                                                        {rule.enabled ? '✓' : '○'}
                                                    </button>
                                                </Tooltip>
                                                <Button
                                                    onClick={() => handleEditRule(rule)}
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    size="sm"
                                                    variant="destructive"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            <div className="mb-1">
                                                <strong>Trigger:</strong> {rule.trigger.eventName}
                                                {Object.keys(rule.trigger.eventData || {}).length > 0 && (
                                                    <span> (with filters)</span>
                                                )}
                                            </div>
                                            {rule.conditions && rule.conditions.length > 0 && (
                                                <div className="mb-1">
                                                    <strong>Conditions:</strong> {rule.conditions.length} condition(s)
                                                </div>
                                            )}
                                            <div>
                                                <strong>Actions:</strong> {rule.actions.length} action(s)
                                                {rule.actions.map((action, index) => (
                                                    <span key={index} className="ml-1">
                                                        {action.type === 'obs' ? '🎛️' : '🤖'}
                                                    </span>
                                                ))}
                                            </div>
                                            {rule.lastTriggered && (
                                                <div className="mt-1 text-xs opacity-75">
                                                    Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </CollapsibleCard>

            {/* Audio Output Routing Section */}
            <CollapsibleCard
                title="Audio Output Routing"
                emoji="🔊"
                isOpen={openAudio}
                onToggle={() => setOpenAudio((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-4">
                        <AudioOutputSelector />
                    </div>
                </CardContent>
            </CollapsibleCard>

            {/* OBS Event Subscriptions Section */}
            <CollapsibleCard
                title="OBS Event Subscriptions"
                emoji="🎛️"
                isOpen={openObsEvents}
                onToggle={() => setOpenObsEvents((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        <p className="text-sm text-muted-foreground mb-2">
                            Select which OBS events you want to subscribe to for real-time notifications and automations. You can change these at any time.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            {OBS_EVENT_LIST.map((event) => (
                                <div key={event.name} className="flex items-center gap-2 py-1">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={obsEventSubscriptions.includes(event.name)}
                                            onChange={() => handleObsEventToggle(event.name)}
                                            className="accent-accent h-4 w-4 rounded border border-border"
                                        />
                                        <span className="font-mono text-xs text-primary min-w-[120px]">{event.name}</span>
                                        <Tooltip content={event.description}>
                                            <span className="text-muted-foreground truncate">{event.description}</span>
                                        </Tooltip>
                                    </label>
                                    <AddToContextButton
                                        contextText={`OBS Event: '${event.name}'\n\nExample: \`\`\`json\n${JSON.stringify({ event: event.name, example: '...event data here...' }, null, 2)}\n\`\`\``}
                                        onAddToContext={addToUserDefinedContext}
                                    />
                                    <Tooltip content={`Create automation rule for ${event.name}`}>
                                        <Button
                                            onClick={() => handleCreateRule(event.name)}
                                            size="sm"
                                            variant="secondary"
                                            className="ml-1 text-xs px-2 py-1"
                                        >
                                            🤖
                                        </Button>
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </CollapsibleCard>

            {/* OBS Logs Section */}
            <CollapsibleCard
                title="OBS Logs"
                emoji="📝"
                isOpen={openLogs}
                onToggle={() => setOpenLogs((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Access and upload OBS log files for debugging and troubleshooting. Upload logs to share with support or analyze streaming issues.
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={async () => {
                                    if (!obsServiceInstance) return;
                                    try {
                                        const logs = await obsServiceInstance.getLogFileList();
                                        setObsLogFiles(logs.logFiles);
                                    } catch (error: any) {
                                        console.error('Failed to fetch log files:', error);
                                    }
                                }}
                                size="sm"
                                variant="secondary"
                            >
                                Fetch Log List
                            </Button>
                            <Button
                                onClick={async () => {
                                    setIsUploadingLog(true);
                                    setUploadResult(null);
                                    try {
                                        const result = await uploadLog();
                                        setUploadResult(result);
                                        if (result.success && result.url) {
                                            addMessage({
                                                role: 'system',
                                                text: `📝 **OBS Log Uploaded Successfully**\n\nURL: ${result.url}\n\nYou can share this URL with support or for debugging purposes.`
                                            });
                                        }
                                    } catch (error: any) {
                                        setUploadResult({
                                            success: false,
                                            message: `Failed to upload log: ${error.message}`
                                        });
                                    } finally {
                                        setIsUploadingLog(false);
                                    }
                                }}
                                size="sm"
                                disabled={isUploadingLog}
                            >
                                {isUploadingLog ? 'Uploading...' : 'Upload Latest Log'}
                            </Button>
                        </div>

                        {uploadResult && (
                            <div className={`p-3 rounded text-sm ${uploadResult.success
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                <div className="font-medium mb-1">
                                    {uploadResult.success ? '✅ Upload Successful' : '❌ Upload Failed'}
                                </div>
                                <div className="text-xs">{uploadResult.message}</div>
                                {uploadResult.success && uploadResult.url && (
                                    <div className="mt-2">
                                        <a
                                            href={uploadResult.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                                        >
                                            {uploadResult.url}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {obsLogFiles && obsLogFiles.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-primary">Available Log Files:</label>
                                <div className="max-h-40 overflow-y-auto">
                                    {obsLogFiles.map((logFile: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded text-sm">
                                            <div>
                                                <div className="font-medium text-foreground">{logFile.fileName || `Log ${index + 1}`}</div>
                                                {logFile.fileSize && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Size: {(logFile.fileSize / 1024).toFixed(1)} KB
                                                    </div>
                                                )}
                                                {logFile.creationTime && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Created: {new Date(logFile.creationTime).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                            <AddToContextButton
                                                contextText={`OBS Log File: ${logFile.fileName || `Log ${index + 1}`}${logFile.fileSize ? ` (${(logFile.fileSize / 1024).toFixed(1)} KB)` : ''}${logFile.creationTime ? ` - Created: ${new Date(logFile.creationTime).toLocaleString()}` : ''}`}
                                                title="Add log file info to chat context"
                                                onAddToContext={addToUserDefinedContext}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {obsLogFiles && obsLogFiles.length === 0 && (
                            <div className="text-center text-muted-foreground py-4">
                                <p>No log files available. Click "Fetch Log List" to retrieve log files from OBS.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </CollapsibleCard>

            {/* Custom API Keys Section */}
            <CollapsibleCard
                title="Custom API Keys"
                emoji="🔑"
                isOpen={openApiKeys}
                onToggle={() => setOpenApiKeys((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Enter your own API keys for supported services. These are stored only in your browser and used instead of the default keys.
                        </p>
                        <div className="space-y-3">
                            {PANEL_API_KEY_SERVICES.map(({ id, label, optional }) => (
                                <div key={id} className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-primary">
                                        {label} API Key
                                        {!optional && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            className="w-full border rounded p-2 bg-background"
                                            type={showApiKey[id] ? 'text' : 'password'}
                                            value={localApiKeyInputs[id] || ''}
                                            onChange={e => handleApiKeyInputChange(id, e.target.value)}
                                            placeholder={`Enter your ${label} API key`}
                                            autoComplete="new-password"
                                        />
                                        <Button
                                            onClick={() => setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }))}
                                            variant="ghost"
                                            size="sm"
                                            className="px-2"
                                            type="button"
                                        >
                                            {showApiKey[id] ? '🙈' : '👁️'}
                                        </Button>
                                        <Button
                                            onClick={() => handleApiKeySave(id)}
                                            size="sm"
                                            disabled={localApiKeyInputs[id] === undefined || localApiKeyInputs[id]?.trim() === overrides[id]?.trim()}
                                        >
                                            {overrides[id] ? 'Update' : 'Save'}
                                        </Button>
                                        {overrides[id] && (
                                            <Button
                                                onClick={() => handleApiKeyRemove(id)}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    {overrides[id] && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Currently active: <span className="font-mono break-all">{overrides[id]}</span>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(overrides[id] || '')}
                                                className="ml-2 text-accent hover:text-accent-hover"
                                                title="Copy key"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    )}
                                    {!optional && (
                                        <p className="text-xs text-red-400 mt-1">
                                            This API key is required for core functionality.
                                        </p>
                                    )}
                                    {optional && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            This API key is optional and enhances specific features.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </CollapsibleCard>
            {/* Reset Section */}
            <CollapsibleCard
                title="Reset Settings"
                emoji="🔄"
                isOpen={openReset}
                onToggle={() => setOpenReset((v) => !v)}
                accentColor={accentColor}
            >
                <CardContent className="px-3 pb-3">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Clear all saved preferences and return to defaults. This will reset theme colors, connection settings, and other preferences.
                        </p>
                        <Button
                            onClick={handleResetAllSettings}
                            variant="destructive"
                            size="sm"
                        >
                            Reset All Settings
                        </Button>
                    </div>
                </CardContent>
            </CollapsibleCard>

            {/* Automation Rule Builder Modal */}
            <AutomationRuleBuilder
                isOpen={showRuleBuilder}
                onClose={handleCloseRuleBuilder}
                initialEventName={ruleBuilderInitialEvent}
                editingRule={editingRule}
            />
        </div>
    );
};

export default AdvancedPanel;
