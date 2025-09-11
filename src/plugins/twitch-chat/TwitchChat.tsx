import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useTmi, type TmiTags, type TwitchMessage } from '@/hooks/useTmi';
import { TwitchChatList } from './TwitchChatList';


const TwitchChat: React.FC = () => {
  const { theme } = useTheme();
  const {
    channel,
    setChannel,
    connected,
    messages,
    emoteSize,
    setEmoteSize,
    maxMessages,
    setMaxMessages,
    newMessageAtTop,
    setNewMessageAtTop,
    autoScroll,
    setAutoScroll,
    isAtBottom,
    listRef,
    handleConnect,
    handleDisconnect,
    adjustHtmlForSizeAndLazy
  } = useTmi();

  return (
      <div className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Twitch Chat</h3>
          <div className="flex gap-2 mb-3">
            <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="channel" className="p-2 rounded border-border transition-all duration-200 ease-in-out" />
            {connected ? <Button onClick={handleDisconnect} variant="destructive" size="sm" className="p-2">Disconnect</Button> : <Button onClick={handleConnect} variant="default" size="sm" className="p-2">Connect</Button>}
          </div>
    
          <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label>Emote size</label>
            <select value={String(emoteSize)} onChange={(e) => setEmoteSize(Number(e.target.value))} className="p-2 rounded border-border transition-all duration-200 ease-in-out">
              <option value="16">16</option>
              <option value="20">20</option>
              <option value="28">28</option>
              <option value="40">40</option>
            </select>
    
            <label>Max</label>
            <input type="number" value={maxMessages} onChange={(e) => setMaxMessages(Math.max(10, Number(e.target.value || 0)))} className="w-20 p-2 rounded border-border transition-all duration-200 ease-in-out" />
    
            <label><input type="checkbox" checked={newMessageAtTop} onChange={(e) => setNewMessageAtTop(e.target.checked)} className="mr-1 transition-all duration-200 ease-in-out" /> New at top</label>
            <label><input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="mr-1 transition-all duration-200 ease-in-out" /> Auto-scroll</label>
          </div>
    
          <TwitchChatList
            messages={messages}
            emoteSize={emoteSize}
            adjustHtmlForSizeAndLazy={adjustHtmlForSizeAndLazy}
            listRef={listRef}
            autoScroll={autoScroll}
            newMessageAtTop={newMessageAtTop}
            isAtBottom={isAtBottom}
          />
        </div>
      );
    };
    
    export default TwitchChat;
