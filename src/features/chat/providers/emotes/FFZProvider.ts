import type { EmoteProvider, EmoteData, ParsedMessage, MessageSegment } from '../../core/emoteTypes';

export class FFZEmoteProvider implements EmoteProvider {
  name = 'ffz';
  priority = 3;
  private globalEmotes: Map<string, EmoteData> = new Map();
  private channelEmotes: Map<string, Map<string, EmoteData>> = new Map();

  constructor() {
    this.loadGlobalEmotes();
  }

  private async loadGlobalEmotes() {
    try {
      const response = await fetch('https://api.frankerfacez.com/v1/set/global');
      const data = await response.json();
      const emoteSet = data.sets[data.default_sets[0]];

      emoteSet.emoticons.forEach((emote: any) => {
        const url = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
        this.globalEmotes.set(emote.name, {
          id: emote.id.toString(),
          name: emote.name,
          url: `https:${url}`,
          provider: 'ffz',
          animated: false, // FFZ API doesn't seem to have a simple animated flag here
        });
      });
    } catch (error) {
      console.error('Failed to load FFZ global emotes:', error);
    }
  }

  public async loadChannelEmotes(channelId: string) {
    if (this.channelEmotes.has(channelId)) return;
    try {
      const response = await fetch(`https://api.frankerfacez.com/v1/room/${channelId}`);
      const data = await response.json();
      if (!data.room) return;

      const emoteSet = data.sets[data.room.set];
      const channelEmoteMap = new Map<string, EmoteData>();

      emoteSet.emoticons.forEach((emote: any) => {
        const url = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
        channelEmoteMap.set(emote.name, {
          id: emote.id.toString(),
          name: emote.name,
          url: `https:${url}`,
          provider: 'ffz',
          animated: false,
        });
      });
      this.channelEmotes.set(channelId, channelEmoteMap);
    } catch (error) {
      console.error(`Failed to load FFZ channel emotes for ${channelId}:`, error);
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
}