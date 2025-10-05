import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { geminiService } from '@/services/geminiService';
import { useChat } from '@/features/chat/hooks/useChat';
import { TwitchChatList } from './TwitchChatList';

const TwitchChat: React.FC = () => {
  const { messages, isConnected, connect, disconnect } = useChat('twitch');

  const [channel, setChannel] = useState('');
  const [emoteSize, setEmoteSize] = useState(20);
  const [newMessageAtTop, setNewMessageAtTop] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

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

  const filteredMessages = messages.filter((message) =>
    message.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.raw.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConnect = () => {
    if (channel) connect(channel);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Twitch Chat</h3>
        <div className="flex gap-2 mb-3">
          <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="channel" className="p-2 rounded border-border transition-all duration-200 ease-in-out" />
          {isConnected ? <Button onClick={handleDisconnect} variant="destructive" size="sm" className="p-2">Disconnect</Button> : <Button onClick={handleConnect} variant="default" size="sm" className="p-2">Connect</Button>}
        </div>
      
        <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label>Emote size</label>
          <select value={String(emoteSize)} onChange={(e) => setEmoteSize(Number(e.target.value))} className="p-2 rounded border-border transition-all duration-200 ease-in-out">
            <option value="16">16</option>
            <option value="20">20</option>
            <option value="28">28</option>
            <option value="40">40</option>
          </select>
      
          <label><input type="checkbox" checked={newMessageAtTop} onChange={(e) => setNewMessageAtTop(e.target.checked)} className="mr-1 transition-all duration-200 ease-in-out" /> New at top</label>
          <label><input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="mr-1 transition-all duration-200 ease-in-out" /> Auto-scroll</label>
        </div>
        <div className="mb-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user or keyword..."
            className="w-full p-2 rounded border-border transition-all duration-200 ease-in-out"
          />
        </div>
        <div className="flex gap-2 mb-2">
          <Button
            onClick={async () => {
              if (filteredMessages.length === 0) return;
              const recentMessages = filteredMessages.slice(-10).map(m => `${m.user.displayName}: ${m.raw}`).join('\n');
              const summaryResult = await geminiService.generateContent(`Summarize the following recent Twitch chat messages: \n${recentMessages}`);
              setSummary(summaryResult.text);
              setShowSummary(true);
            }}
            variant="outline"
            size="sm"
            disabled={filteredMessages.length === 0 || !isConnected}
          >
            Summarize Recent Messages
          </Button>
          <Button
            onClick={() => setSearchTerm('')}
            variant="ghost"
            size="sm"
          >
            Clear Search
          </Button>
        </div>
        <TwitchChatList
          messages={filteredMessages}
          emoteSize={emoteSize}
          listRef={listRef}
          autoScroll={autoScroll}
          newMessageAtTop={newMessageAtTop}
          isAtBottom={isAtBottom}
        />
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
    </>
  );
};

export default TwitchChat;
