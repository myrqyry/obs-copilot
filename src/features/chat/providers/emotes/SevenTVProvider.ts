import type { EmoteProvider, EmoteData, ParsedMessage, MessageSegment } from '../../core/emoteTypes';

export class SevenTVEmoteProvider implements EmoteProvider {
  name = '7tv';
  priority = 4;
  private globalEmotes: Map<string, EmoteData> = new Map();
  private channelEmotes: Map<string, Map<string, EmoteData>> = new Map();

  constructor() {
    this.loadGlobalEmotes();
  }

  private async loadGlobalEmotes() {
    try {
      const response = await fetch('https://7tv.io/v3/emote-sets/global');
      const data = await response.json();

      data.emotes.forEach((emote: any) => {
        const url = this.getEmoteUrl(emote.id, emote.data.animated);
        this.globalEmotes.set(emote.name, {
          id: emote.id,
          name: emote.name,
          url,
          provider: '7tv',
          animated: emote.data.animated,
        });
      });
    } catch (error) {
      console.error('Failed to load 7TV global emotes:', error);
    }
  }

  public async loadChannelEmotes(channelId: string) {
    if (this.channelEmotes.has(channelId)) return;
    try {
      // First, get the user's active emote set
      const userResponse = await fetch(`https://7tv.io/v3/users/twitch/${channelId}`);
      const userData = await userResponse.json();
      const emoteSetId = userData.emote_set?.id;

      if (!emoteSetId) return;

      // Now fetch the emotes from that set
      const emoteSetResponse = await fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`);
      const emoteSetData = await emoteSetResponse.json();

      const channelEmoteMap = new Map<string, EmoteData>();
      emoteSetData.emotes.forEach((emote: any) => {
        const url = this.getEmoteUrl(emote.id, emote.data.animated);
        channelEmoteMap.set(emote.name, {
          id: emote.id,
          name: emote.name,
          url,
          provider: '7tv',
          animated: emote.data.animated,
        });
      });
      this.channelEmotes.set(channelId, channelEmoteMap);

    } catch (error) {
      console.error(`Failed to load 7TV channel emotes for ${channelId}:`, error);
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
        segments.push({ type: 'emote', content: word, data: emote });
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
    if (channelId) {
      const channelEmoteMap = this.channelEmotes.get(channelId);
      if (channelEmoteMap && channelEmoteMap.has(emoteName)) {
        return channelEmoteMap.get(emoteName);
      }
    }
    return this.globalEmotes.get(emoteName);
  }

  private getEmoteUrl(emoteId: string, animated: boolean): string {
    // 7TV uses WebP format. We'll use the 4x size for best quality.
    return `https://cdn.7tv.app/emote/${emoteId}/4x.webp`;
  }
}