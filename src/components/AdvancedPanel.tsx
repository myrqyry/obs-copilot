import Tooltip from './ui/Tooltip';
import React, { useState, useEffect } from 'react';
import { OBS_EVENT_LIST } from '../constants/obsEvents';
import { useAppStore } from '../store/appStore';
import { Button } from './common/Button';
import { Card, CardContent } from './ui';
import { cn } from '../lib/utils';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import AddToContextButton from './common/AddToContextButton';

const API_KEY_SERVICES = [
    { id: 'giphy', label: 'Giphy' },
    { id: 'tenor', label: 'Tenor' },
    { id: 'wallhaven', label: 'Wallhaven' },
];

export const LOCAL_STORAGE_KEY = 'customApiKeys';

/**
 * Get all custom API keys from localStorage.
 * @returns {Record<string, string>} Object of { service: key }
 */
export function getCustomApiKeys(): Record<string, string> {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch { }
    return {};
}

/**
 * Get a custom API key for a given service, or undefined if not set.
 * @param {string} service
 * @returns {string|undefined}
 */
export function getCustomApiKey(service: string): string | undefined {
    return getCustomApiKeys()[service];
}

/**
 * Set a custom API key for a given service.
 * @param {string} service
 * @param {string} key
 */
export function setCustomApiKey(service: string, key: string) {
    const keys = getCustomApiKeys();
    keys[service] = key;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys));
}

/**
 * Remove a custom API key for a given service.
 * @param {string} service
 */
export function removeCustomApiKey(service: string) {
    const keys = getCustomApiKeys();
    delete keys[service];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys));
}

const OBS_SUBSCRIPTIONS_KEY = 'obsEventSubscriptions';

const AdvancedPanel: React.FC = () => {
    // OBS Event Subscriptions State
    const [openObsEvents, setOpenObsEvents] = useState(false);
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
    const userDefinedContext = useAppStore((state) => state.userDefinedContext);
    const addToUserDefinedContext = useAppStore((state) => state.actions.addToUserDefinedContext);
    const removeFromUserDefinedContext = useAppStore((state) => state.actions.removeFromUserDefinedContext);
    const clearUserDefinedContext = useAppStore((state) => state.actions.clearUserDefinedContext);
    const [userInput, setUserInput] = useState('');
    const [openMemory, setOpenMemory] = useState(true);
    const [openReset, setOpenReset] = useState(false);
    const [openApiKeys, setOpenApiKeys] = useState(false);
    const safeParseApiKeys = (stored: string | null): { [service: string]: string } => {
        if (!stored) return {};
        try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch { }
        return {};
    };
    const [apiKeys, setApiKeys] = useState<{ [service: string]: string }>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            return safeParseApiKeys(stored);
        } catch {
            return {};
        }
    });
    const [apiKeyInputs, setApiKeyInputs] = useState<{ [service: string]: string }>(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            return safeParseApiKeys(stored);
        } catch {
            return {};
        }
    });
    // Get the current OBSWebSocketService instance from the store
    const obsServiceInstance = useAppStore((state) => state.obsServiceInstance);
    // Get the addMessage action from the store
    const addMessage = useAppStore((state) => state.actions.addMessage);



    // Load API keys from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                setApiKeys(JSON.parse(stored));
                setApiKeyInputs(JSON.parse(stored));
            }
        } catch { }
    }, []);

    // Save API keys to localStorage
    const persistApiKeys = (newKeys: { [service: string]: string }) => {
        setApiKeys(newKeys);
        setApiKeyInputs(newKeys);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newKeys));
        } catch { }
    };

    const handleApiKeyChange = (service: string, value: string) => {
        setApiKeyInputs((prev) => ({ ...prev, [service]: value }));
    };

    const handleApiKeySave = (service: string) => {
        const newKeys = { ...apiKeys, [service]: apiKeyInputs[service]?.trim() || '' };
        persistApiKeys(newKeys);
    };

    const handleApiKeyRemove = (service: string) => {
        const newKeys = { ...apiKeys };
        delete newKeys[service];
        persistApiKeys(newKeys);
    };

    // Reset settings logic (matches ObsSettingsPanel)
    const handleResetAllSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to defaults? This will clear your saved connection details, theme preferences, and other settings.')) {
            import('../utils/persistence').then(({ clearAllSettings }) => {
                clearAllSettings();
                window.location.reload();
            });
        }
    };

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
            };
        });
        obsServiceInstance.subscribeToEvents(handlers);
    }, [obsServiceInstance, obsEventSubscriptions, addMessage]);

    return (
        <div className="space-y-3 max-w-2xl mx-auto">
            {/* OBS Event Subscriptions Section */}
            <Card className="border-border">
                <button
                    className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                    onClick={() => setOpenObsEvents((v) => !v)}
                    aria-expanded={openObsEvents}
                >
                    <div className="flex items-center space-x-2">
                        <span className="emoji text-sm">🎛️</span>
                        <span className="text-sm font-semibold text-foreground">OBS Event Subscriptions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                            {openObsEvents ? 'Hide' : 'Show'} options
                        </span>
                        <svg
                            className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                openObsEvents ? 'rotate-180' : ''
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {openObsEvents && (
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
                                        // Tooltip for AddToContextButton handled in AddToContextButton itself
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
            {/* Custom API Keys Section */}
            <Card className="border-border">
                <button
                    className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                    onClick={() => setOpenApiKeys((v) => !v)}
                    aria-expanded={openApiKeys}
                >
                    <div className="flex items-center space-x-2">
                        <span className="emoji text-sm">🔑</span>
                        <span className="text-sm font-semibold text-foreground">Custom API Keys</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                            {openApiKeys ? 'Hide' : 'Show'} options
                        </span>
                        <svg
                            className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                openApiKeys ? 'rotate-180' : ''
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {openApiKeys && (
                    <CardContent className="px-3 pb-3">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Enter your own API keys for supported services. These are stored only in your browser and used instead of the default keys.
                            </p>
                            <div className="space-y-3">
                                {API_KEY_SERVICES.map(({ id, label }) => (
                                    <div key={id} className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-primary">{label} API Key</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                className="w-full border rounded p-2 bg-background"
                                                type="text"
                                                value={apiKeyInputs[id] || ''}
                                                onChange={e => handleApiKeyChange(id, e.target.value)}
                                                placeholder={`Enter your ${label} API key`}
                                            />
                                            <Button
                                                onClick={() => handleApiKeySave(id)}
                                                size="sm"
                                                disabled={!(apiKeyInputs[id] && apiKeyInputs[id].trim())}
                                            >
                                                {apiKeys[id] ? 'Update' : 'Save'}
                                            </Button>
                                            {apiKeys[id] && (
                                                <Button
                                                    onClick={() => handleApiKeyRemove(id)}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                        {apiKeys[id] && (
                                            <div className="text-xs text-muted-foreground break-all">
                                                <span className="font-mono">{apiKeys[id]}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
            {/* Memory Context Section */}
            <Card className="border-border">
                <button
                    className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                    onClick={() => setOpenMemory((v) => !v)}
                    aria-expanded={openMemory}
                >
                    <div className="flex items-center space-x-2">
                        <span className="emoji text-sm">🧠</span>
                        <span className="text-sm font-semibold text-foreground">Memory Context</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                            {openMemory ? 'Hide' : 'Show'} options
                        </span>
                        <svg
                            className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                openMemory ? 'rotate-180' : ''
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {openMemory && (
                    <CardContent className="px-3 pb-3">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Add custom context that will be included with all Gemini conversations. Great for streaming details, community info, or personal preferences.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    className="w-full border rounded p-2 bg-background"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
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
                                                    variant="danger"
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
                )}
            </Card>
            {/* Reset Section */}
            <Card className="border-border">
                <button
                    className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
                    onClick={() => setOpenReset((v) => !v)}
                    aria-expanded={openReset}
                >
                    <div className="flex items-center space-x-2">
                        <span className="emoji text-sm">🔄</span>
                        <span className="text-sm font-semibold text-foreground">Reset Settings</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                            {openReset ? 'Hide' : 'Show'} options
                        </span>
                        <svg
                            className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                openReset ? 'rotate-180' : ''
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                {openReset && (
                    <CardContent className="px-3 pb-3">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Clear all saved preferences and return to defaults. This will reset theme colors, connection settings, and other preferences.
                            </p>
                            <Button
                                onClick={handleResetAllSettings}
                                variant="danger"
                                size="sm"
                            >
                                Reset All Settings
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default AdvancedPanel;
