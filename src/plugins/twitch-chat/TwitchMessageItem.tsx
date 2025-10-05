import React from 'react';
import { SecureHtmlRenderer } from '@/components/ui/SecureHtmlRenderer';
import type { ChatMessage } from '@/features/chat/core/types';
import type { TmiTags } from '@/hooks/useTmi';

interface TwitchMessageItemProps {
  message: ChatMessage;
  emoteSize: number;
}

export const TwitchMessageItem: React.FC<TwitchMessageItemProps> = ({
  message,
  emoteSize,
}) => {
  const { user, html, tags, timestamp } = message;

  const renderBadges = (tags?: TmiTags) => {
    const badges = tags?.badges;
    if (!badges) return null;
    return (
      <>
        {badges.broadcaster && <span className="ml-1 bg-purple-600 text-xs px-1 rounded text-white">Broadcaster</span>}
        {badges.partner && <span className="ml-1 bg-blue-600 text-xs px-1 rounded text-white">Partner</span>}
        {badges.moderator && <span className="ml-1 bg-purple-500 text-xs px-1 rounded text-white">Mod</span>}
        {badges.subscriber && <span className="ml-1 bg-green-500 text-xs px-1 rounded text-white">Sub</span>}
        {badges.vip && <span className="ml-1 bg-orange-500 text-xs px-1 rounded text-white">VIP</span>}
      </>
    );
  };

  const userStyle: React.CSSProperties = {
    color: user.color ?? undefined,
    ...user.paintStyle,
  };

  const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Create a dynamic style for emotes
  const emoteStyle = `
    .emote {
      height: ${emoteSize}px;
      width: ${emoteSize}px;
      margin: -0.2rem 0.1rem;
      vertical-align: middle;
      display: inline-block;
    }
  `;

  return (
    <div data-msg-id={message.id} className="mb-2">
      <style>{emoteStyle}</style>
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-start text-sm leading-relaxed">
        <span
          className="font-bold text-blue-600 mr-1 min-w-0 truncate"
          style={userStyle}
        >
          {user.displayName}:
        </span>
        {renderBadges(tags)}
        <span className="text-xs text-gray-500 ml-2">({formattedTime})</span>
        <SecureHtmlRenderer
          htmlContent={html}
          className="ml-2"
        />
      </div>
    </div>
  );
};