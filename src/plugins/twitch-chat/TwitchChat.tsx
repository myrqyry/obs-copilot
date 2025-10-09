import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { geminiService } from '@/services/geminiService';
import { useChat } from '@/features/chat/hooks/useChat';
import { EmoteEngine } from '@/features/chat/core/EmoteEngine';
import MessageRenderer from '@/features/chat/components/MessageRenderer';
import ChatStyleConfig, { type Customizations } from '@/features/chat/components/ChatStyleConfig';
import ChatConnectionInput from '@/features/chat/components/ChatConnectionInput';
import ChatSearch from '@/features/chat/components/ChatSearch';
import { ChatThemes } from '@/features/chat/styles/ChatThemes';
import type { ChatMessage } from '@/features/chat/core/types';
import type { ParsedMessage } from '@/features/chat/core/emoteTypes';
import useEmoteWallStore from '@/store/emoteWallStore';
import ConfigSection from '@/components/common/ConfigSection';
import ConfigInput from '@/components/common/ConfigInput';
import ConfigToggle from '@/components/common/ConfigToggle';

// Define a new type for messages that include the parsed content
type ProcessedMessage = ChatMessage & { parsed: ParsedMessage };

const TwitchChat: React.FC = () => {
  const { messages, isConnected, connect, disconnect } = useChat('twitch');
  const { channel, setChannel } = useEmoteWallStore();

  const [newMessageAtTop, setNewMessageAtTop] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [processedMessages, setProcessedMessages] = useState<ProcessedMessage[]>([]);
  const processedIds = useRef(new Set<string>());
  const [emoteEngine] = useState(() => new EmoteEngine());

  const [selectedThemeKey, setSelectedThemeKey] = useState('default');
  const [customizations, setCustomizations] = useState<Customizations>({
    emoteProviders: { twitch: true, bttv: true, ffz: true, seventv: true },
    effects: { animateEmotes: true, emoteScale: 1.0, showBadges: true, showTimestamps: false },
    filtering: { hideCommands: false, minMessageLength: 0, blockedWords: [] }
  });
  const selectedTheme = ChatThemes[selectedThemeKey];

  const listRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Process raw messages from the chat hook
  useEffect(() => {
    const processNewMessages = async () => {
      const messagesToProcess = messages.filter(msg => !processedIds.current.has(msg.id));
      if (messagesToProcess.length === 0) return;

      const newlyProcessed = await Promise.all(
        messagesToProcess.map(async (msg) => {
          processedIds.current.add(msg.id);
          const parsed = await emoteEngine.parseMessage(msg.raw, channel);
          return { ...msg, parsed };
        })
      );

      setProcessedMessages(prev => {
        const combined = [...prev, ...newlyProcessed];
        // Prune if the list gets too long
        if (combined.length > 500) {
            const toRemove = combined.slice(0, combined.length - 400);
            toRemove.forEach(msg => processedIds.current.delete(msg.id));
            return combined.slice(combined.length - 400);
        }
        return combined;
      });
    };

    processNewMessages();
  }, [messages, channel, emoteEngine]);


  useEffect(() => {
    const handleScroll = () => {
      const el = listRef.current;
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 100);
      }
    };
    const el = listRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const filteredMessages = processedMessages.filter((message) =>
    message.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.raw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConnect = () => {
    if (channel) connect(channel);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSummarize = async () => {
    if (filteredMessages.length === 0) return;
    const recentMessages = filteredMessages.slice(-10).map(m => `${m.user.displayName}: ${m.raw}`).join('\n');
    const summaryResult = await geminiService.generateContent(`Summarize the following recent Twitch chat messages: \n${recentMessages}`);
    setSummary(summaryResult.text);
    setShowSummary(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const themeStyle = {
    background: selectedTheme.background,
    fontFamily: selectedTheme.font.family,
    fontSize: `${selectedTheme.font.size}px`,
    '--text-color': selectedTheme.colors.text,
    '--username-color': selectedTheme.colors.username,
    '--timestamp-color': selectedTheme.colors.timestamp,
  } as React.CSSProperties;

  return (
    <div className="flex">
      <div className="w-2/3 p-4">
        <ConfigSection title="Twitch Chat">
          <div className="flex gap-2 mb-3">
            <ConfigInput
              id="twitch-channel"
              label="Channel"
              placeholder="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            />
            {isConnected ? <Button onClick={handleDisconnect} variant="destructive" size="sm" className="p-2">Disconnect</Button> : <Button onClick={handleConnect} variant="default" size="sm" className="p-2">Connect</Button>}
          </div>
        
          <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <ConfigToggle
              id="new-message-at-top"
              label="New messages at top"
              description="Display new messages at the top of the chat list."
              checked={newMessageAtTop}
              onCheckedChange={setNewMessageAtTop}
            />
            <ConfigToggle
              id="auto-scroll"
              label="Auto-scroll"
              description="Automatically scroll to the bottom for new messages."
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
            />
          </div>
          <ChatSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSummarize={handleSummarize}
            onClearSearch={handleClearSearch}
            isSummarizeDisabled={filteredMessages.length === 0 || !isConnected}
          />

          {/* New Message List */}
          <div
            ref={listRef}
            className="flex-1 min-h-[50vh] max-h-[70vh] w-full overflow-auto border p-2 text-white scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
            style={themeStyle}
            role="log"
            aria-live="polite"
            aria-label="Twitch chat messages"
          >
            {filteredMessages.map((message) => {
              const userStyle: React.CSSProperties = {
                  color: message.user.color || 'var(--username-color)',
                  ...message.user.paintStyle
              };

              return (
               <div key={message.id} className="mb-2" style={{ marginBottom: `${selectedTheme.messageSpacing}px`}}>
                  {customizations.effects.showTimestamps && (
                      <span className="text-xs mr-2" style={{ color: 'var(--timestamp-color)' }}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                  )}
                  <span className="font-bold mr-1" style={userStyle}>
                    {message.user.displayName}:
                  </span>
                  <MessageRenderer
                      parsedMessage={message.parsed}
                      animateEmotes={customizations.effects.animateEmotes}
                      emoteScale={customizations.effects.emoteScale}
                  />
              </div>
            )})}
          </div>
        </ConfigSection>
      </div>
      <div className="w-1/3 p-4 border-l border-border">
          <ConfigSection title="Chat Style Configuration">
            <ChatStyleConfig
              selectedTheme={selectedThemeKey}
              onThemeChange={setSelectedThemeKey}
              customizations={customizations}
              onCustomizationsChange={setCustomizations}
            />
          </ConfigSection>
      </div>

      {showSummary && (
        <Modal
          title="Chat Summary"
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
        >
          <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
        </Modal>
      )}
    </div>
  );
};

export default TwitchChat;
