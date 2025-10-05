import type { EmoteProvider, EmoteData, ParsedMessage, MessageSegment } from '../../core/emoteTypes';

export class BTTVEmoteProvider implements EmoteProvider {
  name = 'bttv';
  priority = 2;
  private globalEmotes: Map<string, EmoteData> = new Map();
  private channelEmotes: Map<string, Map<string, EmoteData>> = new Map();

  constructor() {
    this.loadGlobalEmotes();
  }

  private async loadGlobalEmotes() {
    try {
      const response = await fetch('https://api.betterttv.net/3/cached/emotes/global');
      const emotes = await response.json();

      emotes.forEach((emote: any) => {
        this.globalEmotes.set(emote.code, {
          id: emote.id,
          name: emote.code,
          url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
          provider: 'bttv',
          animated: emote.imageType === 'gif'
        });
      });
    } catch (error) {
      console.error('Failed to load BTTV global emotes:', error);
    }
  }

  public async loadChannelEmotes(channelId: string) {
    if (this.channelEmotes.has(channelId)) return; // Already loaded or loading
    try {
      const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`);
      const data = await response.json();

      const channelEmoteMap = new Map<string, EmoteData>();

      [...(data.channelEmotes || []), ...(data.sharedEmotes || [])].forEach((emote: any) => {
        channelEmoteMap.set(emote.code, {
          id: emote.id,
          name: emote.code,
          url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
          provider: 'bttv',
          animated: emote.imageType === 'gif'
        });
      });

      this.channelEmotes.set(channelId, channelEmoteMap);
    } catch (error) {
      console.error(`Failed to load BTTV channel emotes for ${channelId}:`, error);
    }
  }

  public async parseEmotes(text: string, channelId?: string): Promise<ParsedMessage> {
    const segments: MessageSegment[] = [];
    const foundEmotes: EmoteData[] = [];

    const words = text.split(' ');
    let currentText = '';

    for (const word of words) {
      const emote = this.findEmote(word, channelId);

      if (emote) {
        if (currentText) {
            segments.push({ type: 'text', content: currentText });
            currentText = '';
        }
        segments.push({
          type: 'emote',
          content: word,
          data: emote
        });
        foundEmotes.push(emote);
      } else {
        currentText += word + ' ';
      }
    }

    if (currentText) {
        segments.push({ type: 'text', content: currentText.trimEnd() });
    }

    return { segments, emotes: foundEmotes };
  }

  private findEmote(emoteName: string, channelId?: string): EmoteData | undefined {
    // Check channel emotes first
    if (channelId) {
      const channelEmoteMap = this.channelEmotes.get(channelId);
      const channelEmote = channelEmoteMap?.get(emoteName);
      if (channelEmote) return channelEmote;
    }

    // Check global emotes
    return this.globalEmotes.get(emoteName);
  }
}