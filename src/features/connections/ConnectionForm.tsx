import Tooltip from './ui/Tooltip';
import { ApiService } from '../store/apiKeyStore';
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from './ui/Button';
import { TextInput } from './common/TextInput';
import { FaviconIcon } from './common/FaviconIcon';
import { CatppuccinAccentColorName } from '../types';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from '../utils/persistence';
import { CardContent } from './ui';
import { cn } from '../lib/utils';
import { CollapsibleCard } from './common/CollapsibleCard';
import useConnectionsStore from '../store/connectionsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useChatStore } from '../store/chatStore';
import { catppuccinAccentColorsHexMap } from '../types';
import { z, ZodError } from 'zod';
import { obsConnectionSchema, streamerBotConnectionSchema, geminiApiKeySchema } from '../lib/validations';

interface ConnectionFormProps {
  defaultUrl: string;
  envGeminiApiKey?: string;
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
  defaultUrl,
  envGeminiApiKey,
  streamerBotAddress,
  setStreamerBotAddress,
  streamerBotPort,
  setStreamerBotPort,
  onStreamerBotConnect,
  onStreamerBotDisconnect,
  isStreamerBotConnected = false,
  isStreamerBotConnecting = false,
  // accentColorName, // This prop is not used, storeAccentColorName is used instead
}) => {
  const { geminiApiKey, isGeminiClientInitialized, geminiInitializationError, actions: { setGeminiApiKey: onGeminiApiKeyChange } } = useChatStore();
  const storeAccentColorName = useSettingsStore(state => state.theme.accent);
  const accentColor = catppuccinAccentColorsHexMap[storeAccentColorName] || '#89b4fa';

  // Destructure from the new unified store
  const { isConnected, isConnecting, actions } = useConnectionsStore();
  const connectError = ''; // Adjust this based on the actual state in useConnectionsStore
  const { connect: onConnect, disconnect: onDisconnect } = actions;

  const persistedConnectionSettings = isStorageAvailable() ? loadConnectionSettings() : {};

  const [address, setAddress] = useState<string>(
    persistedConnectionSettings.obsWebSocketUrl || defaultUrl
  );
  // SECURITY: Never persist OBS passwords. Initialize empty and keep in memory only.
  const [password, setPassword] = useState<string>('');
  const [localGeminiKey, setLocalGeminiKey] = useState<string>(geminiApiKey);
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false);
  const [autoConnect, setAutoConnect] = useState<boolean>(
    Boolean(persistedConnectionSettings.autoConnect)
  );
  const [showApiKeyOverride, setShowApiKeyOverride] = useState<boolean>(
    Boolean(storedGeminiApiKey)
  );

  const [obsAddressError, setObsAddressError] = useState<string | undefined>(undefined);
  const [obsPasswordError, setObsPasswordError] = useState<string | undefined>(undefined);
  const [streamerBotAddressError, setStreamerBotAddressError] = useState<string | undefined>(undefined);
  const [streamerBotPortError, setStreamerBotPortError] = useState<string | undefined>(undefined);
  const [geminiApiKeyError, setGeminiApiKeyError] = useState<string | undefined>(undefined);

  const [obsExpanded, setObsExpanded] = useState<boolean>(true);
  const [geminiExpanded, setGeminiExpanded] = useState<boolean>(true);
  const [streamerBotExpanded, setStreamerBotExpanded] = useState<boolean>(false);
  const obsConnectingDotRef = useRef<HTMLSpanElement>(null);
  const geminiStatusDotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey);
  }, [geminiApiKey]);

  const handleLocalGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setLocalGeminiKey(newKey);
    onGeminiApiKeyChange(newKey);
  };

  const handleApiKeyOverrideToggle = (enabled: boolean) => {
    setShowApiKeyOverride(enabled);
    if (!enabled) {
      setLocalGeminiKey('');
      onGeminiApiKeyChange('');
    }
  };

  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedConnect(true);

    let obsValidationSuccess = true;
    try {
      obsConnectionSchema.parse({
        obsWebSocketUrl: address,
        obsPassword: showPasswordField ? password : undefined,
      });
      setObsAddressError(undefined);
      setObsPasswordError(undefined);
    } catch (err) {
      if (err instanceof ZodError) {
        obsValidationSuccess = false;
        err.issues.forEach((validationError) => {
          if (validationError.path[0] === 'obsWebSocketUrl') {
            setObsAddressError(validationError.message);
          }
          if (validationError.path[0] === 'obsPassword') {
            setObsPasswordError(validationError.message);
          }
        });
      }
    }

    if (!isConnected && obsValidationSuccess) {
      if (isStorageAvailable()) {
        // Do not persist password
        saveConnectionSettings({
          obsWebSocketUrl: address,
          autoConnect: autoConnect
        });
      }
      onConnect(address, showPasswordField ? password : undefined);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setObsAddressError(undefined); // Clear error on change
    if (isStorageAvailable()) {
      saveConnectionSettings({ obsWebSocketUrl: newAddress });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setObsPasswordError(undefined); // Clear error on change
  };

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
        gsap.to(dot, { scale: 1.4, opacity: 0.5, repeat: -1, yoyo: true, duration: 0.7, ease: 'power1.inOut' });
      } else {
        gsap.killTweensOf(dot);
        gsap.set(dot, { clearProps: "all" });
      }
    }
    return () => { if (dot) gsap.killTweensOf(dot); };
  }, [isConnecting]);

  useEffect(() => {
    const dot = geminiStatusDotRef.current;
    if (dot) {
      if (!isGeminiClientInitialized && !geminiInitializationError) {
        gsap.to(dot, { scale: 1.4, opacity: 0.5, repeat: -1, yoyo: true, duration: 0.7, ease: 'power1.inOut' });
      } else {
        gsap.killTweensOf(dot);
        gsap.set(dot, { clearProps: "all" });
      }
    }
    return () => { if (dot) gsap.killTweensOf(dot); };
  }, [isGeminiClientInitialized, geminiInitializationError]);

  return (
    <div className="space-y-2 max-w-4xl mx-auto p-0">
      <CollapsibleCard
        title="OBS Studio Connection"
        emoji="🎬"
        isOpen={obsExpanded}
        onToggle={() => setObsExpanded(!obsExpanded)}
        accentColor={accentColor}
        domain="obsproject.com"
        className="relative group w-full"
      >
        <CardContent className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 sm:pt-2">
          <div className="absolute top-1 right-1 sm:right-2 opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1">
            {isConnected && (
              <>
                <Tooltip content="Reconnect to OBS">
                  <button
                    type="button"
                    aria-label="Reconnect to OBS"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConnect(address, showPasswordField ? password : undefined);
                    }}
                    className="w-5 h-5 p-0.5 rounded-full bg-blue-500/70 hover:bg-blue-600 text-white transition-all duration-200 opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-background"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip content="Disconnect from OBS">
                  <button
                    type="button"
                    aria-label="Disconnect from OBS"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisconnect();
                    }}
                    className="w-5 h-5 p-0.5 rounded-full bg-red-500/70 hover:bg-red-600 text-white transition-all duration-200 opacity-70 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-background"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip content={isConnected ? 'Connected to OBS' : isConnecting ? 'Connecting to OBS...' : 'Disconnected from OBS'}>
              <span
                ref={obsConnectingDotRef}
                tabIndex={0}
                className={cn(
                  "inline-block w-3 h-3 rounded-full border border-white/50 transition-all duration-300 cursor-help focus:outline-none focus:ring-1 focus:ring-white",
                  isConnected ? 'bg-primary' : isConnecting ? 'bg-yellow-500' : 'bg-destructive'
                )}
                title={isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              />
            </Tooltip> {/* This was the mismatched Tooltip */}
          </div> {/* This div for buttons/status is now correctly closed */}

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
              <div className="md:col-span-2 lg:col-span-2 flex items-center gap-2">
                <TextInput
                  label="WebSocket URL"
                  id="obs-address"
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  disabled={isConnected || isConnecting}
                  placeholder="ws://localhost:4455"
                  size="sm"
                  error={obsAddressError}
                />
              </div>
              <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-2 lg:col-span-2">
                <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group flex-1">
                  <input
                    type="checkbox"
                    id="enable-password"
                    checked={showPasswordField}
                    onChange={(e) => setShowPasswordField(e.target.checked)}
                    disabled={isConnected || isConnecting}
                    className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background checked:bg-primary checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50 transition duration-150 group-hover:border-border disabled:opacity-50"
                  />
                  <span className={cn("group-hover:text-foreground transition-colors duration-200 text-xs", (isConnected || isConnecting) && "opacity-50 cursor-not-allowed")}>
                    <span className="mr-1">🔐</span> Requires password
                  </span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group flex-1" title="Automatically connect to OBS when the app loads">
                  <input
                    type="checkbox"
                    id="auto-connect"
                    checked={autoConnect}
                    onChange={handleAutoConnectChange}
                    className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background checked:bg-primary checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50 transition duration-150 group-hover:border-border"
                  />
                  <span className="group-hover:text-foreground transition-colors duration-200 text-xs">
                    <span className="mr-1">⚡</span> Auto-connect
                  </span>
                </label>
              </div>
            </div>
            {showPasswordField && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <TextInput
                  label="Password"
                  id="obs-password"
                  name="obs-password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isConnected || isConnecting}
                  placeholder="Enter OBS WebSocket password"
                  size="sm"
                  autoComplete="current-password"
                  error={obsPasswordError}
                />
              </div>
            )}
            {hasAttemptedConnect && error && (
              <div className="p-2 bg-destructive/10 border border-destructive/30 rounded">
                <p className="text-destructive text-xs font-medium">{error}</p>
              </div>
            )}
            {!isConnected && (
              <div className="flex justify-start pt-1">
                <Button
                  type="submit"
                  variant="default"
                  isLoading={isConnecting}
                  disabled={isConnecting}
                  size="sm"
                  // accentColorName={storeAccentColorName} // Removed accentColorName
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </CollapsibleCard>

      <CollapsibleCard
        title="Streamer.bot"
        emoji="🤖"
        isOpen={streamerBotExpanded}
        onToggle={() => setStreamerBotExpanded(!streamerBotExpanded)}
        accentColor={accentColor}
        domain="streamer.bot"
        className="relative group w-full"
      >
        <CardContent className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 sm:pt-2">
          <div className="absolute top-1 right-1 sm:right-2 opacity-50 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1">
            {isStreamerBotConnected && (
              <>
                <Tooltip content="Reconnect">
                  <button type="button" onClick={(e) => { e.stopPropagation(); if (onStreamerBotConnect) onStreamerBotConnect(); }} className="w-3 h-3 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                  </button>
                </Tooltip>
                <Tooltip content="Disconnect">
                  <button type="button" onClick={(e) => { e.stopPropagation(); if (onStreamerBotDisconnect) onStreamerBotDisconnect(); }} className="w-3 h-3 p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip content={isStreamerBotConnecting ? 'Connecting...' : isStreamerBotConnected ? 'Connected' : 'Disconnected'}>
              <span className={`inline-block w-2 h-2 rounded-full border border-white ${isStreamerBotConnecting ? 'bg-yellow-500 animate-pulse' : isStreamerBotConnected ? 'bg-green-500' : 'bg-muted'}`} />
            </Tooltip>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TextInput
                label="Address"
                id="streamerbot-address"
                type="text"
                value={streamerBotAddress || 'localhost'}
                onChange={(e) => {
                  setStreamerBotAddress(e.target.value || 'localhost');
                  setStreamerBotAddressError(undefined);
                }}
                className="text-sm"
                size="sm"
                error={streamerBotAddressError}
              />
              <TextInput
                label="Port"
                id="streamerbot-port"
                type="text"
                value={streamerBotPort || '8080'}
                onChange={(e) => {
                  setStreamerBotPort(e.target.value || '8080');
                  setStreamerBotPortError(undefined);
                }}
                className="text-sm"
                size="sm"
                error={streamerBotPortError}
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              {!isStreamerBotConnected ? (
                <Button
                  onClick={() => {
                    let streamerBotValidationSuccess = true;
                    try {
                      streamerBotConnectionSchema.parse({
                        streamerBotAddress: streamerBotAddress || 'localhost',
                        streamerBotPort: streamerBotPort || '8080',
                      });
                      setStreamerBotAddressError(undefined);
                      setStreamerBotPortError(undefined);
                    } catch (err) {
                      if (err instanceof ZodError) {
                        streamerBotValidationSuccess = false;
                        err.issues.forEach((validationError) => {
                          if (validationError.path[0] === 'streamerBotAddress') {
                            setStreamerBotAddressError(validationError.message);
                          }
                          if (validationError.path[0] === 'streamerBotPort') {
                            setStreamerBotPortError(validationError.message);
                          }
                        });
                      }
                    }

                    if (streamerBotValidationSuccess && onStreamerBotConnect) {
                      onStreamerBotConnect();
                    }
                  }}
                  disabled={isStreamerBotConnecting || !!streamerBotAddressError || !!streamerBotPortError}
                  isLoading={isStreamerBotConnecting}
                  size="sm"
                  className="flex-1"
                >
                  {isStreamerBotConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              ) : (
                <Button onClick={onStreamerBotDisconnect} variant="secondary" size="sm" className="flex-1">
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

      <CollapsibleCard
        title="Gemini AI Integration"
        emoji="🧠"
        isOpen={geminiExpanded}
        onToggle={() => setGeminiExpanded(!geminiExpanded)}
        accentColor={accentColor}
        domain="gemini.google.com"
        className="relative group w-full"
      >
        <CardContent className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 sm:pt-2 space-y-2 sm:space-y-3">
          <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
            {(isGeminiClientInitialized || geminiInitializationError) && (
              <>
                <Tooltip content="Reconnect">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onGeminiApiKeyChange(localGeminiKey || geminiApiKey);}} className="w-3 h-3 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                  </button>
                </Tooltip>
                <Tooltip content="Status">
                  <span ref={geminiStatusDotRef} className={cn("inline-block w-3 h-3 rounded-full border border-white transition-all duration-300", geminiInitializationError ? 'bg-red-500' : isGeminiClientInitialized ? 'bg-green-500' : 'bg-yellow-500')} />
                </Tooltip>
              </>
            )}
            {!isGeminiClientInitialized && !geminiInitializationError && (
              <Tooltip content="Initialize">
                <button type="button" onClick={() => { if (localGeminiKey || geminiApiKey) { onGeminiApiKeyChange(localGeminiKey || geminiApiKey); }}} className="w-3 h-3 p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors duration-200">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                </button>
              </Tooltip>
            )}
          </div>
          <div className="p-2 sm:p-3 rounded bg-card border border-border">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Environment:</span>
                <code className="text-xs sm:text-sm bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-foreground">GEMINI_API_KEY</code>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className={cn("w-2 h-2 rounded-full", envGeminiApiKey ? 'bg-primary' : 'bg-destructive')} />
                <span className={cn("text-xs sm:text-sm font-medium", envGeminiApiKey ? 'text-primary' : 'text-destructive')}>
                  {envGeminiApiKey ? 'Found' : 'Not found'}
                </span>
              </div>
            </div>
            {!envGeminiApiKey && (<p className="text-xs sm:text-sm text-muted-foreground">💡 Create <code className="bg-muted px-1 rounded">.env.local</code> with <code className="bg-muted px-1 rounded">GEMINI_API_KEY=your_key</code></p>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 items-end">
            <div className="flex items-center space-x-2 md:col-span-2 lg:col-span-3">
              <label className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground cursor-pointer group">
                <input type="checkbox" id="enable-api-override" checked={showApiKeyOverride} onChange={(e) => handleApiKeyOverrideToggle(e.target.checked)} className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background checked:bg-primary checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50 transition duration-150 group-hover:border-border" />
                <span className="group-hover:text-foreground transition-colors duration-200"><span className="mr-1">🔧</span> Override environment API key</span>
              </label>
            </div>
          </div>
          {showApiKeyOverride && (
            <form onSubmit={(e) => { e.preventDefault(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 items-end">
                <div className="md:col-span-2 lg:col-span-2">
                  <TextInput
                    label={`API Key ${envGeminiApiKey ? '(Override Environment)' : '(Required)'}`}
                    id="gemini-api-key"
                    name="gemini-api-key"
                    type="password"
                    value={localGeminiKey}
                    onChange={(e) => {
                      handleLocalGeminiKeyChange(e);
                      setGeminiApiKeyError(undefined);
                    }}
                    placeholder={envGeminiApiKey ? "Leave empty to use environment variable" : "Enter your Gemini API Key"}
                    size="sm"
                    error={geminiApiKeyError}
                  />
                </div>
                <div className="flex gap-1 sm:gap-2">
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
                          setGeminiApiKeyError(undefined);
                        } catch (err) {
                          console.error("Failed to read clipboard:", err);
                        }
                      }
                    }}
                    className="flex-1"
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
                        setGeminiApiKeyError(undefined);
                      }}
                      className="flex-1"
                    >
                      🗑️ Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-start pt-1">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (showApiKeyOverride) {
                      let geminiValidationSuccess = true;
                      try {
                        geminiApiKeySchema.parse({
                          geminiApiKey: localGeminiKey,
                        });
                        setGeminiApiKeyError(undefined);
                      } catch (err) {
                        if (err instanceof ZodError) {
                          geminiValidationSuccess = false;
                          err.issues.forEach((validationError) => {
                            if (validationError.path[0] === 'geminiApiKey') {
                              setGeminiApiKeyError(validationError.message);
                            }
                          });
                        }
                      }
                      if (geminiValidationSuccess) {
                        onGeminiApiKeyChange(localGeminiKey);
                      }
                    } else {
                      onGeminiApiKeyChange(localGeminiKey);
                    }
                  }}
                  disabled={showApiKeyOverride && (localGeminiKey.trim() === '' || !!geminiApiKeyError)}
                >
                  Save API Key
                </Button>
              </div>
            </form>
          )}
          <div className="text-xs sm:text-sm text-muted-foreground bg-card p-2 sm:p-3 rounded border border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span><strong>Priority:</strong> {showApiKeyOverride ? 'Manual → Environment → None' : 'Environment → None'}</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-all">Get API Key →</a>
            </div>
            {isStorageAvailable() && showApiKeyOverride && (<p className="text-primary mt-1 sm:mt-2">💾 Manual input auto-saved</p>)}
          </div>
        </CardContent>
      </CollapsibleCard>
    </div>
  );
};
