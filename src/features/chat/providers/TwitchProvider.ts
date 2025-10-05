import tmi from 'tmi.js';
import _ from 'lodash';
import * as emoteService from '@/services/chatEmoteService';
import twitchResolver from '@/services/twitchResolver';
import TwitchEmoticons from '@mkody/twitch-emoticons';
import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';

import type { ChatProvider, ChatMessage, ChatUser } from '../core/types';
import type { TmiTags, TwitchMessage } from '@/hooks/useTmi'; // Re-using this for now

const { EmoteFetcher, EmoteParser } = TwitchEmoticons;

let seq = 0;
const makeId = () => `m_${Date.now().toString(36)}_${seq++}`;

export class TwitchProvider extends EventTarget implements ChatProvider {
  public readonly platform = 'twitch';
  private client: tmi.Client | null = null;
  private channel: string | null = null;
  private messageHistory: ChatMessage[] = [];
  private emoteMap: Map<string, { src: string }> = new Map();
  private emoteFetcher: any | null = null;
  private emoteParser: any | null = null;
  private fetchedUsers: Set<string> = new Set();
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
      await this.preloadEmotes(channel);
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
      this.emoteMap.clear();
      this.fetchedUsers.clear();
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

  private async preloadEmotes(channel: string): Promise<void> {
    try {
        const combined = await emoteService.getCombinedEmotes(undefined, channel);
        this.emoteMap = new Map(Object.entries(combined || {}).map(([k, v]: any) => [k, { src: v.src || v.url || '' }]));

        this.emoteFetcher = new EmoteFetcher();
        await Promise.all([
          this.emoteFetcher.fetchBTTVEmotes(),
          this.emoteFetcher.fetchSevenTVEmotes(),
          this.emoteFetcher.fetchFFZEmotes(),
        ]);
        this.emoteParser = new EmoteParser(this.emoteFetcher, { template: '<img class="emote" alt="{name}" src="{link}">' });

    } catch (e) {
      const errorMsg = handleAppError('TwitchProvider emote preload', e, 'Failed to preload emotes');
      useUiStore.getState().addError({ message: errorMsg, source: 'TwitchProvider', level: 'error', details: { channel, error: e } });
    }
  }

  private async handleMessage(channel: string, tags: tmi.ChatUserstate, message: string, self: boolean): Promise<void> {
    if (self) return;

    const tmiTags = (tags || {}) as TmiTags;
    const html = emoteService.generateSafeMessageHtml(message, tmiTags, this.emoteMap, this.emoteParser);

    const user: ChatUser = {
        id: tmiTags['user-id'],
        name: tmiTags.username || 'unknown',
        displayName: tmiTags['display-name'] || tmiTags.username || 'unknown',
        color: tmiTags.color,
        badges: tmiTags.badges,
        paintStyle: null,
    };

    const chatMessage: ChatMessage = {
      id: makeId(),
      user,
      raw: message,
      html,
      timestamp: Date.now(),
      tags: tmiTags,
      isAction: message.startsWith('\u0001ACTION'),
    };

    // Asynchronously fetch additional user details (color, paint)
    this.enrichUser(user, tmiTags).then(enrichedUser => {
        const finalMessage = { ...chatMessage, user: enrichedUser };
        this.addMessageToHistory(finalMessage);
        this.dispatchEvent(new CustomEvent('message', { detail: finalMessage }));
    });
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
            // Log error but don't block
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
        // Log error but don't block
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