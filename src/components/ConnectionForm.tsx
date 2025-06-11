

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { CatppuccinAccentColorName } from '../types';

interface ConnectionFormProps {
  onConnect: (address: string, password?: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  defaultUrl: string;
  error: string | null;
  geminiApiKey: string;
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
  onGeminiApiKeyChange,
  isGeminiClientInitialized,
  geminiInitializationError,
  accentColorName,
}) => {
  const [address, setAddress] = useState<string>(defaultUrl);
  const [password, setPassword] = useState<string>('');
  const [localGeminiKey, setLocalGeminiKey] = useState<string>(geminiApiKey);
  const obsConnectingDotRef = useRef<HTMLSpanElement>(null);
  const geminiStatusDotRef = useRef<HTMLSpanElement>(null);


  // Keep local state in sync with prop
  useEffect(() => {
    setLocalGeminiKey(geminiApiKey);
  }, [geminiApiKey]);

  const handleLocalGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setLocalGeminiKey(newKey);
    onGeminiApiKeyChange(newKey);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      onConnect(address, password);
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
    <form onSubmit={handleSubmit} className="bg-[var(--ctp-mantle)] p-0.5 rounded-lg space-y-2.5">
      <div className="space-y-2">
        <TextInput
          label="OBS WebSocket URL"
          id="obs-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isConnected || isConnecting}
          placeholder="e.g., ws://localhost:4455"
          accentColorName={accentColorName}
          className="text-xs" 
        />
        <TextInput
          label="OBS Password (optional)"
          id="obs-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isConnected || isConnecting}
          placeholder="Keep it secret, keep it safe!"
          accentColorName={accentColorName}
          className="text-xs"
        />
        <div className="flex items-end gap-2">
          {/* Gemini status dot */}
          <span
            ref={geminiStatusDotRef}
            className={`inline-block w-3 h-3 rounded-full border border-[var(--ctp-surface2)] ${geminiInitializationError
                ? 'bg-[var(--ctp-red)]'
                : isGeminiClientInitialized
                  ? 'bg-[var(--ctp-green)]'
                  : 'bg-[var(--ctp-yellow)]' 
              }`}
            title={geminiInitializationError ? `Gemini Error: ${geminiInitializationError}` : isGeminiClientInitialized ? 'Gemini Ready' : 'Gemini Initializing...'}
            style={{ marginBottom: 4 }} 
          ></span>
          <TextInput
            label="Gemini API Key (Optional)"
            id="gemini-api-key"
            type="password"
            value={localGeminiKey}
            onChange={handleLocalGeminiKeyChange}
            placeholder="Enter your Gemini API Key"
            aria-describedby="gemini-api-key-description"
            accentColorName={accentColorName}
            style={{ flex: 1 }}
            className="text-xs"
          />
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
            className="ml-1"
            accentColorName={accentColorName}
          >
            Paste
          </Button>
        </div>
        <p id="gemini-api-key-description" className="mt-0.5 text-xs text-[var(--ctp-subtext0)]">
          Needed for ✨ Gemini Assistant features. Get yours from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ctp-sky)] hover:text-[var(--ctp-sapphire)] underline transition-colors"
          >
            Google AI Studio
          </a>.
          Key is stored in component state for this session if entered. Falls back to environment variable if unset.
        </p>
      </div>

      {error && <p className="text-[var(--ctp-red)] text-sm p-2 bg-[var(--ctp-crust)] border border-[var(--ctp-maroon)] rounded-md shadow">{error}</p>}

      <div className="flex items-center gap-2 mt-1.5">
        {/* Connection status dot */}
        <span
          ref={obsConnectingDotRef}
          className={`inline-block w-3 h-3 rounded-full border border-[var(--ctp-surface2)] ${isConnected
            ? 'bg-[var(--ctp-green)]'
            : isConnecting
              ? 'bg-[var(--ctp-yellow)]' 
              : 'bg-[var(--ctp-red)]'
            }`}
          title={isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        ></span>
        {isConnected ? (
          <>
            <Button type="button" onClick={onDisconnect} variant="danger" className="flex-1" accentColorName={accentColorName}>
              Disconnect
            </Button>
            <Button
              type="button"
              onClick={() => onConnect(address, password)}
              variant="secondary"
              className="flex-1"
              accentColorName={accentColorName}
              disabled={isConnecting}
            >
              Reconnect
            </Button>
          </>
        ) : (
          <Button type="submit" variant="primary" isLoading={isConnecting} disabled={isConnecting} className="flex-1" accentColorName={accentColorName}>
            {isConnecting ? 'Connecting...' : 'Connect to OBS'}
          </Button>
        )}
      </div>
    </form>
  );
};
