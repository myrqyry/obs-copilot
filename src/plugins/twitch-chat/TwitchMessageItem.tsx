import React from 'react';
import { SecureHtmlRenderer } from '@/components/ui/SecureHtmlRenderer';
import type { TwitchMessage, TmiTags } from '@/hooks/useTmi';

interface TwitchMessageItemProps {
  message: TwitchMessage;
  emoteSize: number;
  adjustHtmlForSizeAndLazy: (html: string, size: number) => string;
}

export const TwitchMessageItem: React.FC<TwitchMessageItemProps> = ({
  message,
  emoteSize,
  adjustHtmlForSizeAndLazy
}) => {
  const { user, messageHtml, nameColor, namePaintStyle, pendingPaint, tags, timestamp } = message;

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
    color: nameColor ?? undefined,
    ...namePaintStyle,
    ...(pendingPaint ? { opacity: 0.7 } : {})
  };

  const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const sanitizedMessageHtml = adjustHtmlForSizeAndLazy(messageHtml, emoteSize);

  return (
    <div data-msg-id={message.id} className="mb-2">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-start text-sm leading-relaxed">
        <span
          className="font-bold text-blue-600 mr-1 min-w-0 truncate"
          style={userStyle}
        >
          {user}:
        </span>
        {renderBadges(tags)}
        <span className="text-xs text-gray-500 ml-2">({formattedTime})</span>
        <SecureHtmlRenderer
          htmlContent={sanitizedMessageHtml}
          className="ml-2"
        />
      </div>
    </div>
  );
};