import Tooltip from './ui/Tooltip';
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { FaviconIcon } from './common/FaviconIcon';
/* import { CogIcon } from './common/CogIcon';
import { Modal } from './common/Modal'; */
import { CatppuccinAccentColorName } from '../types';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from '../utils/persistence';
import { CardContent } from './ui';
import { cn } from '../lib/utils';
import { CollapsibleCard } from './common/CollapsibleCard';
import { useAppStore, AppState } from '../store/appStore';
import { catppuccinAccentColorsHexMap } from '../types';

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
  isStreamerBotConnecting?: boolean;
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
  isStreamerBotConnecting = false,
  accentColorName,
}) => {
  // Get accent color hex from Zustand
  const storeAccentColorName = useAppStore(state => state.theme.accent);
  const accentColor = catppuccinAccentColorsHexMap[storeAccentColorName] || '#89b4fa';

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
    const storedGeminiApiKey = useAppStore((state: AppState) => state.geminiApiKey);
    const [showApiKeyOverride, setShowApiKeyOverride] = useState<boolean>(
        Boolean(storedGeminiApiKey) // Start with true if there's already a stored API key
    );
  // Cog/settings modal state
  // const [showSettingsModal, setShowSettingsModal] = useState(false);
  // Get backgroundOpacity and setter from store
  // const backgroundOpacity = useAppStore(state => state.backgroundOpacity);
  // const setBackgroundOpacity = useAppStore(state => state.actions.setBackgroundOpacity);
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
          obsPassword: password, // Save password regardless of checkbox
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
    <div className="space-y-2 max-w-4xl mx-auto p-0">
      {/* OBS Connection Section */}
      <CollapsibleCard
        title="OBS Studio Connection"
        emoji="🎬"
        isOpen={obsExpanded}
        onToggle={() => setObsExpanded(!obsExpanded)}
        accentColor={accentColor}
        domain="obsproject.com"
        className="relative group"
      >
        <CardContent className="px-3 pb-3 pt-2">
          {/* Connection Status and Action Buttons - positioned absolutely for hover */}
          <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
            {isConnected && (
              <>
                <Tooltip content="Reconnect">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConnect(address, showPasswordField ? password : undefined);
                    }}
                    className="w-3 h-3 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
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
                    className="w-3 h-3 p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </Tooltip>
              </>
            )}
            {/* Status indicator */}
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

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  size="sm"
                />
              </div>

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
                    "group-hover:text-foreground transition-colors duration-200 text-xs",
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
                  <span className="group-hover:text-foreground transition-colors duration-200 text-xs">
                    <span className="mr-1">⚡</span>
                    Auto-connect
                  </span>
                </label>
              </div>
            </div>

            {/* Password Field - Always in form but conditionally visible */}
            {showPasswordField && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <TextInput
                  label="Password"
                  id="obs-password"
                  name="obs-password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isConnected || isConnecting}
                  placeholder="Enter OBS WebSocket password"
                  accentColorName={accentColorName}
                  size="sm"
                  autoComplete="current-password"
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
      </CollapsibleCard>

      {/* Streamer.bot Section */}
      <CollapsibleCard
        title="Streamer.bot"
        emoji="🤖"
        isOpen={streamerBotExpanded}
        onToggle={() => setStreamerBotExpanded(!streamerBotExpanded)}
        accentColor={accentColor}
        domain="streamer.bot"
        className="relative group"
      >
        <CardContent className="px-3 pb-3 pt-2">
          {/* Connection Status and Action Buttons - positioned absolutely for hover */}
          <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
            {isStreamerBotConnected && (
              <>
                <Tooltip content="Reconnect">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStreamerBotConnect) onStreamerBotConnect();
                    }}
                    className="w-3 h-3 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip content="Disconnect">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStreamerBotDisconnect) onStreamerBotDisconnect();
                    }}
                    className="w-3 h-3 p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </Tooltip>
              </>
            )}
            {/* Status indicator */}
            <span
              className={`inline-block w-2 h-2 rounded-full border border-white ${
                isStreamerBotConnecting
                  ? 'bg-yellow-500 animate-pulse'
                  : isStreamerBotConnected
                    ? 'bg-green-500'
                    : 'bg-muted'
              }`}
              title={
                isStreamerBotConnecting
                  ? 'Connecting...'
                  : isStreamerBotConnected
                    ? 'Connected'
                    : 'Disconnected'
              }
            />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <TextInput
                label="Address"
                id="streamerbot-address"
                type="text"
                value={streamerBotAddress || 'localhost'}
                onChange={(e) => setStreamerBotAddress(e.target.value || 'localhost')}
                accentColorName={accentColorName}
                className="text-sm"
                size="sm"
              />
              <TextInput
                label="Port"
                id="streamerbot-port"
                type="text"
                value={streamerBotPort || '8080'}
                onChange={(e) => setStreamerBotPort(e.target.value || '8080')}
                accentColorName={accentColorName}
                className="text-sm"
                size="sm"
              />
            </div>

            {/* StreamerBot Connection Button */}
            <div className="flex space-x-2">
              {!isStreamerBotConnected ? (
                <Button
                  onClick={onStreamerBotConnect}
                  disabled={!(streamerBotAddress || 'localhost').trim() || !(streamerBotPort || '8080').trim() || isStreamerBotConnecting}
                  isLoading={isStreamerBotConnecting}
                  size="sm"
                  className="flex-1"
                  accentColorName={accentColorName}
                >
                  {isStreamerBotConnecting ? 'Connecting...' : 'Connect'}
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

            <div className="text-xs text-muted-foreground bg-card p-2 rounded border border-border flex items-center gap-2">
              <FaviconIcon domain="streamer.bot" size={14} className="mr-1" alt="Streamer.bot favicon" />
              <span>Enhanced automation & triggers {isStreamerBotConnected && <span className="text-green-600 font-medium">✅</span>}</span>
            </div>
          </div>
        </CardContent>
      </CollapsibleCard>

      {/* Gemini AI Section */}
      <CollapsibleCard
        title="Gemini AI Integration"
        emoji="🧠"
        isOpen={geminiExpanded}
        onToggle={() => setGeminiExpanded(!geminiExpanded)}
        accentColor={accentColor}
        domain="gemini.google.com"
        className="relative group"
      >
        <CardContent className="px-3 pb-3 pt-2 space-y-3">
          {/* Connection Status and Action Buttons - positioned absolutely for hover */}
          <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
            {(isGeminiClientInitialized || geminiInitializationError) && (
              <>
                <Tooltip content="Reconnect">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Trigger re-initialization by setting the same API key
                      onGeminiApiKeyChange(localGeminiKey || geminiApiKey);
                    }}
                    className="w-3 h-3 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip content="Status">
                  <span
                    ref={geminiStatusDotRef}
                    className={cn(
                      "inline-block w-3 h-3 rounded-full border border-white transition-all duration-300",
                      geminiInitializationError
                        ? 'bg-red-500'
                        : isGeminiClientInitialized
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                    )}
                  />
                </Tooltip>
              </>
            )}
            {!isGeminiClientInitialized && !geminiInitializationError && (
              <Tooltip content="Initialize">
                <button
                  type="button"
                  onClick={() => {
                    if (localGeminiKey || geminiApiKey) {
                      onGeminiApiKeyChange(localGeminiKey || geminiApiKey);
                    }
                  }}
                  className="w-3 h-3 p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Environment Variable Status - Compact */}
          <div className="p-3 rounded bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Environment:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded text-foreground">
                  VITE_GEMINI_API_KEY
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  envGeminiApiKey ? 'bg-primary' : 'bg-destructive'
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  envGeminiApiKey ? 'text-primary' : 'text-destructive'
                )}>
                  {envGeminiApiKey ? 'Found' : 'Not found'}
                </span>
              </div>
            </div>
            {!envGeminiApiKey && (
              <p className="text-sm text-muted-foreground">
                💡 Create <code className="bg-muted px-1 rounded">.env.local</code> with <code className="bg-muted px-1 rounded">VITE_GEMINI_API_KEY=your_key</code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
            <div className="flex items-center space-x-2 lg:col-span-3">
              <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer group">
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
            <form onSubmit={(e) => { e.preventDefault(); }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
                <div className="lg:col-span-2">
                  <TextInput
                    label={`API Key ${envGeminiApiKey ? '(Override Environment)' : '(Required)'}`}
                    id="gemini-api-key"
                    name="gemini-api-key"
                    type="password"
                    value={localGeminiKey}
                    onChange={handleLocalGeminiKeyChange}
                    placeholder={envGeminiApiKey ? "Leave empty to use environment variable" : "Enter your Gemini API Key"}
                    accentColorName={accentColorName}
                  />
                </div>
                <div className="flex gap-2">
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
            </form>
          )}

          <div className="text-sm text-muted-foreground bg-card p-3 rounded border border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
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
              <p className="text-primary mt-2">💾 Manual input auto-saved</p>
            )}
          </div>
        </CardContent>
      </CollapsibleCard>
    </div>
  );
};
