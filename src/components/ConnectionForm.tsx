
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { CatppuccinAccentColorName } from '../types';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from '../utils/persistence';

interface ConnectionFormProps {
  onConnect: (address: string, password?: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  defaultUrl: string;
  error: string | null;
  geminiApiKey: string;
  envGeminiApiKey?: string;
  onGeminiApiKeyChange: (key: string) => void;
  isGeminiClientInitialized: boolean;
  geminiInitializationError: string | null;
  accentColorName?: CatppuccinAccentColorName;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onConnect,
  onDisconnect,
  isConnected,
  isConnecting,
  defaultUrl,
  error,
  geminiApiKey,
  envGeminiApiKey,
  onGeminiApiKeyChange,
  isGeminiClientInitialized,
  geminiInitializationError,
  accentColorName,
}) => {
  // Load persisted connection settings
  const persistedConnectionSettings = isStorageAvailable() ? loadConnectionSettings() : {};

  const [address, setAddress] = useState<string>(
    persistedConnectionSettings.obsWebSocketUrl || defaultUrl
  );
  const [password, setPassword] = useState<string>(
    persistedConnectionSettings.obsPassword || ''
  );
  const [localGeminiKey, setLocalGeminiKey] = useState<string>(geminiApiKey);
  const [showPasswordField, setShowPasswordField] = useState<boolean>(
    Boolean(persistedConnectionSettings.obsPassword)
  );
  const [showApiKeyOverride, setShowApiKeyOverride] = useState<boolean>(
    Boolean(geminiApiKey) // Start with true if there's already an API key
  );
  const [obsExpanded, setObsExpanded] = useState<boolean>(true);
  const [geminiExpanded, setGeminiExpanded] = useState<boolean>(true);
  const obsConnectingDotRef = useRef<HTMLSpanElement>(null);
  const geminiStatusDotRef = useRef<HTMLSpanElement>(null);


  // Keep local state in sync with prop
  useEffect(() => {
    setLocalGeminiKey(geminiApiKey);
  }, [geminiApiKey]);

  // Debug showPasswordField state changes
  useEffect(() => {
    console.log('showPasswordField state changed to:', showPasswordField);
  }, [showPasswordField]);

  const handleLocalGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setLocalGeminiKey(newKey);
    onGeminiApiKeyChange(newKey);
  };

  // Handle API key override toggle
  const handleApiKeyOverrideToggle = (enabled: boolean) => {
    setShowApiKeyOverride(enabled);
    if (!enabled) {
      // Clear the API key when disabling override
      setLocalGeminiKey('');
      onGeminiApiKeyChange('');
    }
  };

  // Track if user has attempted to connect
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedConnect(true);
    if (!isConnected) {
      // Save connection settings before attempting to connect
      if (isStorageAvailable()) {
        saveConnectionSettings({
          obsWebSocketUrl: address,
          obsPassword: (showPasswordField && password) ? password : undefined // Only save if checkbox is enabled and password exists
        });
      }
      onConnect(address, showPasswordField ? password : undefined);
    }
  };

  // Save address changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    // Debounced save - save immediately for now, could add debouncing later
    if (isStorageAvailable()) {
      saveConnectionSettings({ obsWebSocketUrl: newAddress });
    }
  };

  // Save password changes (optional - user might not want this persisted)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // Only save non-empty passwords to avoid overwriting with empty strings
    if (isStorageAvailable() && newPassword.trim()) {
      saveConnectionSettings({ obsPassword: newPassword });
    }
  };

  useEffect(() => {
    const dot = obsConnectingDotRef.current;
    if (dot) {
      if (isConnecting) {
        gsap.to(dot, {
          scale: 1.4,
          opacity: 0.5,
          repeat: -1,
          yoyo: true,
          duration: 0.7,
          ease: 'power1.inOut',
        });
      } else {
        gsap.killTweensOf(dot);
        gsap.set(dot, { clearProps: "all" });
      }
    }
    return () => {
      if (dot) gsap.killTweensOf(dot);
    };
  }, [isConnecting]);

  useEffect(() => {
    const dot = geminiStatusDotRef.current;
    if (dot) {
      if (!isGeminiClientInitialized && !geminiInitializationError) { // Pulsing only if initializing
        gsap.to(dot, {
          scale: 1.4,
          opacity: 0.5,
          repeat: -1,
          yoyo: true,
          duration: 0.7,
          ease: 'power1.inOut',
        });
      } else {
        gsap.killTweensOf(dot);
        gsap.set(dot, { clearProps: "all" });
      }
    }
    return () => {
      if (dot) gsap.killTweensOf(dot);
    };
  }, [isGeminiClientInitialized, geminiInitializationError]);



  return (
    <div className="space-y-2">
      {/* OBS Connection Section */}
      <div className="bg-[var(--ctp-surface0)] rounded-lg border border-[var(--ctp-surface1)]">
        <button
          onClick={() => setObsExpanded(!obsExpanded)}
          className="w-full p-2 flex items-center justify-between text-left hover:bg-[var(--ctp-surface1)] transition-colors rounded-t-lg group"
        >
          <div className="flex items-center space-x-2">
            <span className="emoji">🎬</span>
            <span className="text-sm font-semibold text-[var(--ctp-text)]">OBS Studio Connection</span>
            <span
              ref={obsConnectingDotRef}
              className={`inline-block w-2 h-2 rounded-full border border-white transition-all duration-300 ${isConnected
                ? 'bg-[var(--dynamic-accent)]'
                : isConnecting
                  ? 'bg-[var(--ctp-yellow)]'
                  : 'bg-[var(--ctp-red)]'
                }`}
              title={isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            />
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Action Icons - appear on hover */}
            {isConnected && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnect(address, showPasswordField ? password : undefined);
                  }}
                  disabled={isConnecting}
                  className="p-1 rounded hover:bg-[var(--ctp-surface2)] transition-colors"
                  title="Reconnect"
                >
                  <svg className="w-3 h-3 text-[var(--dynamic-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect();
                  }}
                  className="p-1 rounded hover:bg-[var(--ctp-surface2)] transition-colors"
                  title="Disconnect"
                >
                  <svg className="w-3 h-3 text-[var(--ctp-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <span className="text-xs text-[var(--ctp-subtext0)]">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
            <svg
              className={`w-4 h-4 text-[var(--ctp-subtext0)] transition-transform duration-200 ${obsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {obsExpanded && (
          <div className="px-2 pb-2">
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* URL and Password Checkbox Row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-end">
                <div className="lg:col-span-2">
                  <TextInput
                    label="WebSocket URL"
                    id="obs-address"
                    type="text"
                    value={address}
                    onChange={handleAddressChange}
                    disabled={isConnected || isConnecting}
                    placeholder="ws://localhost:4455"
                    accentColorName={accentColorName}
                  />
                </div>
                <div className="flex items-center space-x-2 lg:col-span-2">
                  <input
                    type="checkbox"
                    id="enable-password"
                    checked={showPasswordField}
                    onChange={(e) => {
                      console.log('Password toggle clicked:', e.target.checked, 'current state:', showPasswordField);
                      setShowPasswordField(e.target.checked);
                    }}
                    disabled={isConnected || isConnecting}
                    className="w-3 h-3 rounded border-[var(--ctp-surface2)] bg-[var(--ctp-mantle)] text-[var(--dynamic-accent)] focus:ring-[var(--dynamic-accent)] focus:ring-1 hover:border-[var(--ctp-surface1)] transition-colors disabled:hover:border-[var(--ctp-surface2)]"
                  />
                  <label
                    htmlFor="enable-password"
                    className={`text-xs cursor-pointer transition-colors ${isConnected || isConnecting
                      ? 'text-[var(--ctp-overlay0)] cursor-not-allowed'
                      : 'text-[var(--ctp-subtext1)] hover:text-[var(--ctp-text)]'
                      }`}
                  >
                    Requires password
                  </label>
                </div>
              </div>

              {/* Conditional Password Field */}
              {showPasswordField && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <TextInput
                    label="Password"
                    id="obs-password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isConnected || isConnecting}
                    placeholder="Enter OBS WebSocket password"
                    accentColorName={accentColorName}
                  />
                </div>
              )}

              {hasAttemptedConnect && error && (
                <div className="p-2 bg-[var(--ctp-red)] bg-opacity-10 border border-[var(--ctp-red)] border-opacity-30 rounded">
                  <p className="text-[var(--ctp-red)] text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Connect Button - Only show when not connected */}
              {!isConnected && (
                <div className="flex justify-start pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isConnecting}
                    disabled={isConnecting}
                    size="sm"
                    accentColorName={accentColorName}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Gemini AI Section */}
      <div className="bg-[var(--ctp-surface0)] rounded-lg border border-[var(--ctp-surface1)]">
        <button
          onClick={() => setGeminiExpanded(!geminiExpanded)}
          className="w-full p-2 flex items-center justify-between text-left hover:bg-[var(--ctp-surface1)] transition-colors rounded-t-lg"
        >
          <div className="flex items-center space-x-2">
            <span className="emoji">✨</span>
            <span className="text-sm font-semibold text-[var(--ctp-text)]">Gemini AI Integration</span>
            <span
              ref={geminiStatusDotRef}
              className={`inline-block w-2 h-2 rounded-full border border-white transition-all duration-300 ${geminiInitializationError
                ? 'bg-[var(--ctp-red)]'
                : isGeminiClientInitialized
                  ? 'bg-[var(--dynamic-accent)]'
                  : 'bg-[var(--ctp-yellow)]'
                }`}
              title={geminiInitializationError ? `Gemini Error: ${geminiInitializationError}` : isGeminiClientInitialized ? 'Gemini Ready' : 'Gemini Initializing...'}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[var(--ctp-subtext0)]">
              {isGeminiClientInitialized ? 'Ready' : 'Setup needed'}
            </span>
            <svg
              className={`w-4 h-4 text-[var(--ctp-subtext0)] transition-transform duration-200 ${geminiExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {geminiExpanded && (
          <div className="px-2 pb-2 space-y-2">
            {/* Environment Variable Status - Compact */}
            <div className="p-2 rounded bg-[var(--ctp-mantle)] border border-[var(--ctp-surface2)]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-[var(--ctp-subtext1)]">Environment:</span>
                  <code className="text-xs bg-[var(--ctp-surface1)] px-1 rounded text-[var(--ctp-text)]">
                    VITE_GEMINI_API_KEY
                  </code>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${envGeminiApiKey ? 'bg-[var(--dynamic-accent)]' : 'bg-[var(--ctp-red)]'}`} />
                  <span className={`text-xs font-medium ${envGeminiApiKey ? 'text-[var(--dynamic-accent)]' : 'text-[var(--ctp-red)]'}`}>
                    {envGeminiApiKey ? 'Found' : 'Not found'}
                  </span>
                </div>
              </div>
              {!envGeminiApiKey && (
                <p className="text-xs text-[var(--ctp-subtext0)]">
                  💡 Create <code className="bg-[var(--ctp-surface1)] px-1 rounded">.env.local</code> with <code className="bg-[var(--ctp-surface1)] px-1 rounded">VITE_GEMINI_API_KEY=your_key</code>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-end">
              <div className="flex items-center space-x-2 lg:col-span-3">
                <input
                  type="checkbox"
                  id="enable-api-override"
                  checked={showApiKeyOverride}
                  onChange={(e) => handleApiKeyOverrideToggle(e.target.checked)}
                  className="w-3 h-3 rounded border-[var(--ctp-surface2)] bg-[var(--ctp-mantle)] text-[var(--dynamic-accent)] focus:ring-[var(--dynamic-accent)] focus:ring-1 hover:border-[var(--ctp-surface1)] transition-colors"
                />
                <label htmlFor="enable-api-override" className="text-xs text-[var(--ctp-subtext1)] cursor-pointer hover:text-[var(--ctp-text)] transition-colors">
                  Override environment API key
                </label>
              </div>
            </div>

            {showApiKeyOverride && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-end">
                <div className="lg:col-span-2">
                  <TextInput
                    label={`API Key ${envGeminiApiKey ? '(Override Environment)' : '(Required)'}`}
                    id="gemini-api-key"
                    type="password"
                    value={localGeminiKey}
                    onChange={handleLocalGeminiKeyChange}
                    placeholder={envGeminiApiKey ? "Leave empty to use environment variable" : "Enter your Gemini API Key"}
                    accentColorName={accentColorName}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (navigator.clipboard) {
                        try {
                          const text = await navigator.clipboard.readText();
                          setLocalGeminiKey(text);
                          onGeminiApiKeyChange(text);
                        } catch (err) {
                          console.error("Failed to read clipboard:", err)
                        }
                      }
                    }}
                    accentColorName={accentColorName}
                  >
                    📋 Paste
                  </Button>
                  {localGeminiKey && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setLocalGeminiKey('');
                        onGeminiApiKeyChange('');
                      }}
                      accentColorName={accentColorName}
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-[var(--ctp-subtext0)] bg-[var(--ctp-mantle)] p-2 rounded border border-[var(--ctp-surface2)]">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span><strong>Priority:</strong> {showApiKeyOverride ? 'Manual → Environment → None' : 'Environment → None'}</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--dynamic-accent)] hover:brightness-110 underline transition-all"
                >
                  Get API Key →
                </a>
              </div>
              {isStorageAvailable() && showApiKeyOverride && (
                <p className="text-[var(--dynamic-accent)] mt-1">💾 Manual input auto-saved</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
