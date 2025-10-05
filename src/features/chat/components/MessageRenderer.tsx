import React from 'react';
import type { ParsedMessage, MessageSegment, EmoteData, MentionData, LinkData } from '../core/emoteTypes';

interface MessageRendererProps {
  parsedMessage: ParsedMessage;
  animateEmotes?: boolean;
  emoteScale?: number;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
  parsedMessage,
  animateEmotes = true,
  emoteScale = 1
}) => {
  const handleMention = (userName: string) => {
    // In a real app, this would likely open a user profile or info card
    console.log(`Clicked on mention: ${userName}`);
  };

  const renderSegment = (segment: MessageSegment, index: number) => {
    switch (segment.type) {
      case 'text':
        return (
          <span key={index}>
            {segment.content}
          </span>
        );

      case 'emote':
        const emote = segment.data as EmoteData;
        return (
          <img
            key={index}
            src={emote.url}
            alt={emote.name}
            title={emote.name}
            className={`inline-block align-middle mx-1 ${
              emote.animated && animateEmotes ? 'animate-pulse' : ''
            }`}
            style={{
              height: `${28 * emoteScale}px`,
              width: 'auto',
            }}
            loading="lazy"
          />
        );

      case 'mention':
        const mention = segment.data as MentionData;
        return (
          <span
            key={index}
            className="text-blue-400 font-medium hover:text-blue-300 cursor-pointer"
            onClick={() => handleMention(mention.userName)}
          >
            {segment.content}
          </span>
        );

      case 'link':
        const link = segment.data as LinkData;
        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            {segment.content}
          </a>
        );

      default:
        return <span key={index}>{segment.content}</span>;
    }
  };

  return (
    <div className="message-content">
      {parsedMessage.segments.map(renderSegment)}
    </div>
  );
};

export default MessageRenderer;