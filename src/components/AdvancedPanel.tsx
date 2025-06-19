
import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Button } from './common/Button';
import { Card, CardContent } from './ui';
import { cn } from '../lib/utils';

const AdvancedPanel: React.FC = () => {
    const userDefinedContext = useAppStore((state) => state.userDefinedContext);
    const addToUserDefinedContext = useAppStore((state) => state.actions.addToUserDefinedContext);
    const removeFromUserDefinedContext = useAppStore((state) => state.actions.removeFromUserDefinedContext);
    const clearUserDefinedContext = useAppStore((state) => state.actions.clearUserDefinedContext);
    const [userInput, setUserInput] = useState('');
    const [openMemory, setOpenMemory] = useState(true);
    const [openReset, setOpenReset] = useState(false);

    // Reset settings logic (matches ObsSettingsPanel)
    const handleResetAllSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to defaults? This will clear your saved connection details, theme preferences, and other settings.')) {
            import('../utils/persistence').then(({ clearAllSettings }) => {
                clearAllSettings();
                window.location.reload();
            });
        }
    };

    return (
        <div className="space-y-3 max-w-2xl mx-auto">
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
