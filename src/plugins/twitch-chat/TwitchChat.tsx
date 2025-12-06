import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { useRegisterCommand } from '@/shared/hooks/useCommandPalette';
import { geminiService } from '@/shared/services/geminiService';
import { useChat } from '@/features/chat/hooks/useChat';
import { EmoteEngine } from '@/features/chat/core/EmoteEngine';
import MessageRenderer from '@/features/chat/components/MessageRenderer';
import ChatStyleConfig, {
  type Customizations,
} from '@/features/chat/components/ChatStyleConfig';
import ChatConnectionInput from '@/features/chat/components/ChatConnectionInput';
import ChatSearch from '@/features/chat/components/ChatSearch';
import { ChatThemes } from '@/features/chat/styles/ChatThemes';
import type { ChatMessage } from '@/features/chat/core/types';
import type { ParsedMessage } from '@/features/chat/core/emoteTypes';
import useEmoteWallStore from '@/app/store/emoteWallStore';
import ConfigSection from '@/shared/components/common/ConfigSection';
import ConfigInput from '@/shared/components/common/ConfigInput';
import ConfigToggle from '@/shared/components/common/ConfigToggle';
import {
  VirtualList,
  VirtualListHandle,
} from '@/shared/components/common/VirtualList';
import { VariableSizeList } from 'react-window';
import { analytics } from '@/shared/utils/analytics';

// Define a new type for messages that include the parsed content
type ProcessedMessage = ChatMessage & { parsed: ParsedMessage };

// Extract message item as a memoized component
const ChatMessageItem = memo<{
  message: ProcessedMessage;
  style: React.CSSProperties;
  showTimestamps: boolean;
  animateEmotes: boolean;
  emoteScale: number;
  messageSpacing: number;
  onHeightChange?: (height: number) => void;
}>(
  ({
    message,
    style,
    showTimestamps,
    animateEmotes,
    emoteScale,
    messageSpacing,
    onHeightChange,
  }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (ref.current && onHeightChange) {
        const height = ref.current.getBoundingClientRect().height;
        onHeightChange(height);
      }
    }, [onHeightChange, message.parsed]);

    const userStyle: React.CSSProperties = useMemo(
      () => ({
        color: message.user.color || 'var(--username-color)',
        ...message.user.paintStyle,
      }),
      [message.user.color, message.user.paintStyle],
    );

    return (
      <div ref={ref} style={style}>
        <div
          className="mb-2"
          style={{ marginBottom: `${messageSpacing}px` }}
        >
          {showTimestamps && (
            <span
              className="text-xs mr-2"
              style={{ color: 'var(--timestamp-color)' }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          )}
          <span className="font-bold mr-1" style={userStyle}>
            {message.user.displayName}:
          </span>
          <MessageRenderer
            parsedMessage={message.parsed}
            animateEmotes={animateEmotes}
            emoteScale={emoteScale}
          />
        </div>
      </div>
    );
  },
);

ChatMessageItem.displayName = 'ChatMessageItem';

const TwitchChat: React.FC = () => {
  const { messages, isConnected, connect, disconnect } = useChat('twitch');
  const { channel, setChannel } = useEmoteWallStore();

  const [newMessageAtTop, setNewMessageAtTop] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [processedMessages, setProcessedMessages] = useState<
    ProcessedMessage[]
  >([]);
  const processedIds = useRef(new Set<string>());
  const [emoteEngine] = useState(() => new EmoteEngine());

  const [selectedThemeKey, setSelectedThemeKey] = useState('default');
  const [customizations, setCustomizations] = useState<Customizations>({
    emoteProviders: { twitch: true, bttv: true, ffz: true, seventv: true },
    effects: {
      animateEmotes: true,
      emoteScale: 1.0,
      showBadges: true,
      showTimestamps: false,
    },
    filtering: {
      hideCommands: false,
      minMessageLength: 0,
      blockedWords: [],
    },
  });
  const selectedTheme = ChatThemes[selectedThemeKey];

  const virtualListRef = useRef<VirtualListHandle>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Process raw messages from the chat hook
  useEffect(() => {
    const processNewMessages = async () => {
      const messagesToProcess = messages.filter(
        (msg) => !processedIds.current.has(msg.id),
      );
      if (messagesToProcess.length === 0) return;

      const newlyProcessed = await Promise.all(
        messagesToProcess.map(async (msg) => {
          processedIds.current.add(msg.id);
          const parsed = await emoteEngine.parseMessage(msg.raw, channel);
          return { ...msg, parsed };
        }),
      );

      setProcessedMessages((prev) => {
        const combined = [...prev, ...newlyProcessed];
        // Prune if the list gets too long
        if (combined.length > 500) {
          const toRemove = combined.slice(0, combined.length - 400);
          toRemove.forEach((msg) => processedIds.current.delete(msg.id));
          return combined.slice(combined.length - 400);
        }
        return combined;
      });
    };

    processNewMessages();
  }, [messages, channel, emoteEngine]);

  const filteredMessages = processedMessages.filter(
    (message) =>
      message.user.displayName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      message.raw.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleConnect = useCallback(() => {
    if (channel) connect(channel);
  }, [channel, connect]);

  // Register command palette shortcut
  useRegisterCommand({
    id: 'twitch-connect',
    name: 'Connect to Twitch',
    description: 'Connect to Twitch chat',
    shortcut: 'mod+shift+t',
    keywords: ['twitch', 'connect', 'chat'],
    action: handleConnect,
    category: 'plugin',
  });

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSummarize = async () => {
    if (filteredMessages.length === 0) return;
    const recentMessages = filteredMessages
      .slice(-10)
      .map((m) => `${m.user.displayName}: ${m.raw}`)
      .join('\n');
    const summaryResult = await geminiService.generateContent(
      `Summarize the following recent Twitch chat messages: \n${recentMessages}`,
    );
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

  // Calculate dynamic heights for messages
  const itemHeights = useRef(new Map<string, number>());
  const listRef = useRef<VariableSizeList>(null);

  const getItemHeight = useCallback(
    (index: number): number => {
      const message = filteredMessages[index];
      if (!message) return 30; // Default height

      // Get cached height or calculate
      const cachedHeight = itemHeights.current.get(message.id);
      if (cachedHeight) return cachedHeight;

      // Estimate height based on content
      const baseHeight = 30;
      // Use the correct property - check your ParsedMessage type definition
      const parts = message.parsed.parts || message.parsed.segments || [];
      const emoteCount = parts.filter((p: any) => p.type === 'emote').length;
      const textLength = message.raw.length;

      // Rough calculation: base + emotes + text wrapping
      const estimatedHeight = Math.max(
        baseHeight,
        baseHeight + emoteCount * 8 + Math.floor(textLength / 60) * 20,
      );

      itemHeights.current.set(message.id, estimatedHeight);
      return estimatedHeight;
    },
    [filteredMessages],
  );

  // Reset heights when messages change significantly
  useEffect(() => {
    listRef.current?.resetAfterIndex(0);
  }, [filteredMessages.length]);

  const renderMessage = useCallback(
    (message: ProcessedMessage, index: number, style: React.CSSProperties) =>
      analytics.trackPerformance(
        'render-message',
        () => (
          <ChatMessageItem
            key={message.id}
            message={message}
            style={style}
            showTimestamps={customizations.effects.showTimestamps}
            animateEmotes={customizations.effects.animateEmotes}
            emoteScale={customizations.effects.emoteScale}
            messageSpacing={selectedTheme.messageSpacing}
            onHeightChange={(height) => {
              // Update actual measured height
              if (itemHeights.current.get(message.id) !== height) {
                itemHeights.current.set(message.id, height);
                listRef.current?.resetAfterIndex(index);
              }
            }}
          />
        ),
        { index, messageId: message.id },
      ),
    [
      customizations.effects.showTimestamps,
      customizations.effects.animateEmotes,
      customizations.effects.emoteScale,
      selectedTheme.messageSpacing,
    ],
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && isAtBottom && filteredMessages.length > 0) {
      virtualListRef.current?.scrollToBottom();
    }
  }, [filteredMessages, autoScroll, isAtBottom]);

  const handleScroll = useCallback(
    (scrollOffset: number, scrollUpdateWasRequested: boolean) => {
      // Only track user scrolls, not programmatic ones
      if (!scrollUpdateWasRequested) {
        // Check if near bottom (within 100px)
        const listElement = document.querySelector(
          '[data-testid="virtual-list"]',
        );
        if (listElement) {
          const { scrollHeight, clientHeight } = listElement;
          setIsAtBottom(scrollHeight - scrollOffset - clientHeight < 100);
        }
      }
    },
    [],
  );

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
            {isConnected ? (
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
                className="p-2"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                variant="default"
                size="sm"
                className="p-2"
              >
                Connect
              </Button>
            )}
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
            isSummarizeDisabled={
              filteredMessages.length === 0 || !isConnected
            }
          />

          {/* New Message List */}
          <div
            className="flex-1 min-h-[50vh] max-h-[70vh] w-full overflow-auto border p-2 text-white"
            style={themeStyle}
            role="log"
            aria-live="polite"
            aria-label="Twitch chat messages"
            data-testid="virtual-list"
          >
            <VirtualList
              ref={virtualListRef}
              items={filteredMessages}
              itemHeight={getItemHeight}
              renderItem={renderMessage}
              onScroll={handleScroll}
            />
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
