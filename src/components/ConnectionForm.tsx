import Tooltip from './ui/Tooltip';
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { FaviconIcon } from './common/FaviconIcon';
import { CogIcon } from './common/CogIcon';
import { Modal } from './common/Modal';
import { useAppStore } from '../store/appStore';
import { CatppuccinAccentColorName } from '../types';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from '../utils/persistence';
import { Card, CardContent } from './ui';
import { cn } from '../lib/utils';

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
  streamerBotAddress: string;
  setStreamerBotAddress: (value: string) => void;
  streamerBotPort: string;
  setStreamerBotPort: (value: string) => void;
  onStreamerBotConnect?: () => void;
  onStreamerBotDisconnect?: () => void;
  isStreamerBotConnected?: boolean;
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
  streamerBotAddress,
  setStreamerBotAddress,
  streamerBotPort,
  setStreamerBotPort,
  onStreamerBotConnect,
  onStreamerBotDisconnect,
  isStreamerBotConnected = false,
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
  const [autoConnect, setAutoConnect] = useState<boolean>(
    Boolean(persistedConnectionSettings.autoConnect)
  );
  const [showApiKeyOverride, setShowApiKeyOverride] = useState<boolean>(
    Boolean(geminiApiKey) // Start with true if there's already an API key
  );
  // Cog/settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // Get backgroundOpacity and setter from store
  const backgroundOpacity = useAppStore(state => state.backgroundOpacity);
  const setBackgroundOpacity = useAppStore(state => state.actions.setBackgroundOpacity);
  const [obsExpanded, setObsExpanded] = useState<boolean>(true);
  const [geminiExpanded, setGeminiExpanded] = useState<boolean>(true);
  const [streamerBotExpanded, setStreamerBotExpanded] = useState<boolean>(false);
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
          obsPassword: (showPasswordField && password) ? password : undefined, // Only save if checkbox is enabled and password exists
          autoConnect: autoConnect // Save auto-connect preference
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

  // Save auto-connect preference changes immediately
  const handleAutoConnectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAutoConnect = e.target.checked;
    setAutoConnect(newAutoConnect);
    if (isStorageAvailable()) {
      saveConnectionSettings({ autoConnect: newAutoConnect });
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
      <Card className="border-border">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setObsExpanded(!obsExpanded)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setObsExpanded(v => !v);
            }
          }}
          className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <FaviconIcon domain="obsproject.com" size={18} className="mr-1" alt="OBS favicon" />
            <span className="text-sm font-semibold text-foreground">OBS Studio Connection</span>
            <span
              ref={obsConnectingDotRef}
              className={cn(
                "inline-block w-2 h-2 rounded-full border border-white transition-all duration-300",
                isConnected
                  ? 'bg-primary'
                  : isConnecting
                    ? 'bg-yellow-500'
                    : 'bg-destructive'
              )}
              title={isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            />
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Action Icons - appear on hover */}
            {isConnected && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Tooltip content="Reconnect">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConnect(address, showPasswordField ? password : undefined);
                    }}
                    disabled={isConnecting}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                  >
                    <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip content="Disconnect">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisconnect();
                    }}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                  >
                    <svg className="w-3 h-3 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
            <svg
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                obsExpanded ? 'rotate-180' : ''
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {obsExpanded && (
          <CardContent className="px-2 pb-2">
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* URL and Password Checkbox Row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-end">
                <div className="lg:col-span-2 flex items-center gap-2">
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
                  <Tooltip content="Chat background opacity settings">
                    <button
                      type="button"
                      className="ml-1 p-1 rounded hover:bg-accent/20 transition-colors"
                      aria-label="Open background opacity settings"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <CogIcon className="w-5 h-5 text-accent" />
                    </button>
                  </Tooltip>
                </div>
                {/* Background Opacity Modal */}
                <Modal
                  title="Chat Background Opacity"
                  isOpen={showSettingsModal}
                  onClose={() => setShowSettingsModal(false)}
                  accentColorName={accentColorName}
                  size="sm"
                  blendMode="multiply" // Example: use any CSS blend mode you want
                >
                  <div className="flex flex-col gap-4 items-center py-2">
                    <label className="text-sm font-medium text-primary flex items-center gap-2">
                      🖼️ Background Opacity
                      <span className="text-xs text-muted-foreground">({Math.round(backgroundOpacity * 100)}%)</span>
                    </label>
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={backgroundOpacity}
                        onChange={e => setBackgroundOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </Modal>
                <div className="flex items-center space-x-2 lg:col-span-1">
                  <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
                    <input
                      type="checkbox"
                      id="enable-password"
                      checked={showPasswordField}
                      onChange={(e) => {
                        console.log('Password toggle clicked:', e.target.checked, 'current state:', showPasswordField);
                        setShowPasswordField(e.target.checked);
                      }}
                      disabled={isConnected || isConnecting}
                      className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                                 checked:bg-primary checked:border-transparent focus:outline-none 
                                 focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                                 transition duration-150 group-hover:border-border disabled:opacity-50"
                    />
                    <span className={cn(
                      "group-hover:text-foreground transition-colors duration-200",
                      (isConnected || isConnecting) && "opacity-50 cursor-not-allowed"
                    )}>
                      <span className="mr-1">🔐</span>
                      Requires password
                    </span>
                  </label>
                </div>
                <div className="flex items-center space-x-2 lg:col-span-1">
                  <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group" title="Automatically connect to OBS when the app loads">
                    <input
                      type="checkbox"
                      id="auto-connect"
                      checked={autoConnect}
                      onChange={handleAutoConnectChange}
                      className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                                 checked:bg-primary checked:border-transparent focus:outline-none 
                                 focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                                 transition duration-150 group-hover:border-border"
                    />
                    <span className="group-hover:text-foreground transition-colors duration-200">
                      <span className="mr-1">⚡</span>
                      Auto-connect
                    </span>
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
                <div className="p-2 bg-destructive/10 border border-destructive/30 rounded">
                  <p className="text-destructive text-xs font-medium">{error}</p>
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
          </CardContent>
        )}
      </Card>

      {/* Streamer.bot Section */}
      <Card className="border-border">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStreamerBotExpanded(!streamerBotExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setStreamerBotExpanded(v => !v);
            }
          }}
          className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <FaviconIcon domain="streamer.bot" size={18} className="mr-1" alt="Streamer.bot favicon" />
            <span className="text-sm font-semibold text-foreground">Streamer.bot</span>
            <span
              className={`inline-block w-2 h-2 rounded-full border border-white ${isStreamerBotConnected
                ? 'bg-green-500'
                : 'bg-muted'
                }`}
              title={isStreamerBotConnected ? 'Connected' : 'Disconnected'}
            />
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Action Icons - appear on hover */}
            {isStreamerBotConnected && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStreamerBotConnect) onStreamerBotConnect();
                  }}
                  className="p-1 rounded hover:bg-secondary transition-colors"
                  title="Reconnect"
                >
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStreamerBotDisconnect) onStreamerBotDisconnect();
                  }}
                  className="p-1 rounded hover:bg-secondary transition-colors"
                  title="Disconnect"
                >
                  <svg className="w-3 h-3 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {isStreamerBotConnected ? 'Connected' : 'Optional'}
            </span>
            <svg
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                streamerBotExpanded ? 'rotate-180' : ''
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {streamerBotExpanded && (
          <CardContent className="px-2 pb-1.5">
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  label="Address"
                  id="streamerbot-address"
                  type="text"
                  value={streamerBotAddress || 'localhost'}
                  onChange={(e) => setStreamerBotAddress(e.target.value || 'localhost')}
                  accentColorName={accentColorName}
                  className="text-sm"
                />
                <TextInput
                  label="Port"
                  id="streamerbot-port"
                  type="text"
                  value={streamerBotPort || '8080'}
                  onChange={(e) => setStreamerBotPort(e.target.value || '8080')}
                  accentColorName={accentColorName}
                  className="text-sm"
                />
              </div>

              {/* StreamerBot Connection Button */}
              <div className="flex space-x-2">
                {!isStreamerBotConnected ? (
                  <Button
                    onClick={onStreamerBotConnect}
                    disabled={!(streamerBotAddress || 'localhost').trim() || !(streamerBotPort || '8080').trim()}
                    size="sm"
                    className="flex-1"
                    accentColorName={accentColorName}
                  >
                    Connect
                  </Button>
                ) : (
                  <Button
                    onClick={onStreamerBotDisconnect}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    accentColorName={accentColorName}
                  >
                    Disconnect
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground bg-card p-1.5 rounded border border-border flex items-center gap-2">
                <FaviconIcon domain="streamer.bot" size={16} className="mr-1" alt="Streamer.bot favicon" />
                <span>Enhanced automation & triggers {isStreamerBotConnected && <span className="text-green-600 font-medium">✅</span>}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Gemini AI Section */}
      <Card className="border-border">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setGeminiExpanded(!geminiExpanded)}
          className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <FaviconIcon domain="gemini.google.com" size={18} className="mr-1" alt="Gemini favicon" />
            <span className="text-sm font-semibold text-foreground">Gemini AI Integration</span>
            <span
              ref={geminiStatusDotRef}
              className={cn(
                "inline-block w-2 h-2 rounded-full border border-white transition-all duration-300",
                geminiInitializationError
                  ? 'bg-destructive'
                  : isGeminiClientInitialized
                    ? 'bg-primary'
                    : 'bg-yellow-500'
              )}
              title={geminiInitializationError ? `Gemini Error: ${geminiInitializationError}` : isGeminiClientInitialized ? 'Gemini Ready' : 'Gemini Initializing...'}
            />
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Action Icons - appear on hover */}
            {(isGeminiClientInitialized || geminiInitializationError) && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger re-initialization by setting the same API key
                    onGeminiApiKeyChange(localGeminiKey || geminiApiKey);
                  }}
                  className="p-1 rounded hover:bg-secondary transition-colors"
                  title="Reconnect/Reinitialize"
                >
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {geminiExpanded && (
          <CardContent className="px-2 pb-2 space-y-2">
            {/* Environment Variable Status - Compact */}
            <div className="p-2 rounded bg-card border border-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-muted-foreground">Environment:</span>
                  <code className="text-xs bg-muted px-1 rounded text-foreground">
                    VITE_GEMINI_API_KEY
                  </code>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    envGeminiApiKey ? 'bg-primary' : 'bg-destructive'
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    envGeminiApiKey ? 'text-primary' : 'text-destructive'
                  )}>
                    {envGeminiApiKey ? 'Found' : 'Not found'}
                  </span>
                </div>
              </div>
              {!envGeminiApiKey && (
                <p className="text-xs text-muted-foreground">
                  💡 Create <code className="bg-muted px-1 rounded">.env.local</code> with <code className="bg-muted px-1 rounded">VITE_GEMINI_API_KEY=your_key</code>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-end">
              <div className="flex items-center space-x-2 lg:col-span-3">
                <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
                  <input
                    type="checkbox"
                    id="enable-api-override"
                    checked={showApiKeyOverride}
                    onChange={(e) => handleApiKeyOverrideToggle(e.target.checked)}
                    className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                               checked:bg-primary checked:border-transparent focus:outline-none 
                               focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                               transition duration-150 group-hover:border-border"
                  />
                  <span className="group-hover:text-foreground transition-colors duration-200">
                    <span className="mr-1">🔧</span>
                    Override environment API key
                  </span>
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

            <div className="text-xs text-muted-foreground bg-card p-2 rounded border border-border">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span><strong>Priority:</strong> {showApiKeyOverride ? 'Manual → Environment → None' : 'Environment → None'}</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline transition-all"
                >
                  Get API Key →
                </a>
              </div>
              {isStorageAvailable() && showApiKeyOverride && (
                <p className="text-primary mt-1">💾 Manual input auto-saved</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
