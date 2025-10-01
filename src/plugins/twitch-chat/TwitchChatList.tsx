import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { TwitchMessageItem } from './TwitchMessageItem';
import type { TwitchMessage } from '@/hooks/useTmi';

interface TwitchChatListProps {
  messages: TwitchMessage[];
  emoteSize: number;
  adjustHtmlForSizeAndLazy: (html: string, size: number) => string;
  listRef: React.RefObject<HTMLDivElement>;
  autoScroll: boolean;
  newMessageAtTop: boolean;
  isAtBottom: boolean;
}

export const TwitchChatList: React.FC<TwitchChatListProps> = ({
  messages,
  emoteSize,
  adjustHtmlForSizeAndLazy,
  listRef,
  autoScroll,
  newMessageAtTop,
  isAtBottom
}) => {
  const animatedSetRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const allNodes = Array.from(root.querySelectorAll('[data-msg-id]')) as HTMLElement[];
    const newNodes = allNodes.filter(n => {
      const id = n.getAttribute('data-msg-id') || '';
      return !animatedSetRef.current.has(id);
    });

    for (const n of newNodes) {
      const id = n.getAttribute('data-msg-id') || '';
      animatedSetRef.current.add(id);
    }

    if (newNodes.length > 0) {
      gsap.fromTo(newNodes, 
        { y: 8, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out', stagger: 0.05 }
      );
    }

    if (autoScroll && isAtBottom) {
      if (newMessageAtTop) {
        root.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, autoScroll, newMessageAtTop, isAtBottom, listRef]);

  // Lazy loader observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const img = e.target as HTMLImageElement;
          const d = img.getAttribute('data-src');
          if (d) {
            img.src = d;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      }
    }, { root: null, rootMargin: '300px', threshold: 0.01 });

    const imgs = Array.from(document.querySelectorAll('img[data-src]')) as HTMLImageElement[];
    imgs.forEach((i) => observer.observe(i));

    return () => observer.disconnect();
  }, [messages]);

  return (
    <div
      ref={listRef}
      className="flex-1 min-h-[50vh] max-h-[70vh] w-full overflow-auto border p-2 bg-white dark:bg-gray-900 text-black dark:text-white scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
      role="log"
      aria-live="polite"
      aria-label="Twitch chat messages"
    >
      {messages.map((message) => (
        <TwitchMessageItem
          key={message.id}
          message={message}
          emoteSize={emoteSize}
          adjustHtmlForSizeAndLazy={adjustHtmlForSizeAndLazy}
        />
      ))}
    </div>
  );
};