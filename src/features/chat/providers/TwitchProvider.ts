import React from 'react';
import tmi from 'tmi.js';
import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';
import * as emoteService from '@/services/chatEmoteService';
import twitchResolver from '@/services/twitchResolver';
import type { ChatProvider, ChatMessage, ChatUser, TmiTags } from '../core/types';

// This was in useTmi.ts, moving it here since that file is deleted.
// TmiTags moved to types.ts

let seq = 0;
const makeId = () => `m_${Date.now().toString(36)}_${seq++}`;

export class TwitchProvider extends EventTarget implements ChatProvider {
  public readonly platform = 'twitch';
  private client: tmi.Client | null = null;
  private channel: string | null = null;
  private messageHistory: ChatMessage[] = [];
  private maxMessages: number = 200;

  constructor() {
    super();
  }

  public async connect(channel: string): Promise<void> {
    this.channel = channel;
    this.client = new tmi.Client({ channels: [this.channel] });

    this.client.on('message', this.handleMessage.bind(this));
    this.client.on('connected', () => this.dispatchEvent(new CustomEvent('connected')));
    this.client.on('disconnected', () => this.dispatchEvent(new CustomEvent('disconnected')));

    try {
      await this.client.connect();
      this.dispatchEvent(new CustomEvent('connected'));
    } catch (err) {
      const errorMsg = handleAppError('TwitchProvider connect', err, `Failed to connect to Twitch for channel ${channel}`);
      useUiStore.getState().addError({ message: errorMsg, source: 'TwitchProvider', level: 'critical', details: { channel, error: err } });
      this.dispatchEvent(new CustomEvent('error', { detail: err }));
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.channel = null;
      this.messageHistory = [];
      this.dispatchEvent(new CustomEvent('disconnected'));
    }
  }

  public async sendMessage(message: string): Promise<void> {
    if (this.client && this.channel) {
      await this.client.say(this.channel, message);
    } else {
      throw new Error('Not connected to a channel.');
    }
  }

  public getHistory(): ChatMessage[] {
    return [...this.messageHistory];
  }

  private async handleMessage(channel: string, tags: tmi.ChatUserstate, message: string, self: boolean): Promise<void> {
    if (self) return;

    const tmiTags = (tags || {}) as TmiTags;

    let user: ChatUser = {
        id: tmiTags['user-id'],
        name: tmiTags.username || 'unknown',
        displayName: tmiTags['display-name'] || tmiTags.username || 'unknown',
        color: tmiTags.color,
        badges: tmiTags.badges,
    };

    user = await this.enrichUser(user, tmiTags);

    const chatMessage: ChatMessage = {
      id: makeId(),
      user,
      raw: message,
      html: message, // The raw message is passed here. Emote parsing will happen later.
      timestamp: Date.now(),
      tags: tmiTags,
      isAction: message.startsWith('\u0001ACTION'),
    };

    this.addMessageToHistory(chatMessage);
    this.dispatchEvent(new CustomEvent('message', { detail: chatMessage }));
  }

  private async enrichUser(user: ChatUser, tags: TmiTags): Promise<ChatUser> {
    const enrichedUser = { ...user };
    // Fetch FFZ color if needed
    if (!tags.color) {
        try {
            const lookupId = await twitchResolver.resolveTwitchId(user.name, user.id, this.client);
            if (lookupId) {
                const color = await emoteService.lookupNameColorFFZ(lookupId);
                if (color) enrichedUser.color = color;
            }
        } catch (e) {
            console.error('Failed to fetch FFZ color', e);
        }
    }

    // Fetch 7TV paint
    try {
        const lookupId = await twitchResolver.resolveTwitchId(user.name, user.id, this.client);
        if (lookupId) {
            const cos = await emoteService.getSevenTVCosmetics(lookupId);
            if (cos) {
                const style: React.CSSProperties = {};
                if (cos.paintBackground) {
                    style.WebkitTextFillColor = 'transparent';
                    style.backgroundClip = 'text';
                    style.WebkitBackgroundClip = 'text';
                    style.backgroundSize = 'cover';
                    style.backgroundColor = 'currentColor';
                    style.backgroundImage = cos.paintBackground;
                }
                if (cos.paintFilter) style.filter = cos.paintFilter;
                if (cos.paintColor) style.color = cos.paintColor;
                enrichedUser.paintStyle = style;
            }
        }
    } catch(e) {
        console.error('Failed to fetch 7TV cosmetics', e);
    }

    return enrichedUser;
  }

  private addMessageToHistory(message: ChatMessage) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxMessages) {
      this.messageHistory.shift();
    }
  }
}