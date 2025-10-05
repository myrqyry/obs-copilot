import type { EmoteProvider, ParsedMessage, MessageSegment, EmoteData } from './emoteTypes';
import { BTTVEmoteProvider } from '../providers/emotes/BTTVProvider';
import { FFZEmoteProvider } from '../providers/emotes/FFZProvider';
import { SevenTVEmoteProvider } from '../providers/emotes/SevenTVProvider';

export class EmoteEngine {
  private providers: Map<string, EmoteProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Native Twitch emotes would be priority 1, handled separately
    this.addProvider(new BTTVEmoteProvider());
    this.addProvider(new FFZEmoteProvider());
    this.addProvider(new SevenTVEmoteProvider());
  }

  public addProvider(provider: EmoteProvider) {
    this.providers.set(provider.name, provider);
  }

  private getProvidersByPriority(): EmoteProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  public async parseMessage(text: string, channelId?: string): Promise<ParsedMessage> {
    let finalSegments: MessageSegment[] = [{ type: 'text', content: text }];
    const allFoundEmotes: EmoteData[] = [];

    for (const provider of this.getProvidersByPriority()) {
      if (channelId && provider.loadChannelEmotes) {
        // Asynchronously load channel-specific emotes for the provider
        await provider.loadChannelEmotes(channelId);
      }

      const nextSegments: MessageSegment[] = [];
      for (const segment of finalSegments) {
        if (segment.type === 'text') {
          // Only parse text segments, leaving existing emote segments untouched
          const result = await provider.parseEmotes(segment.content, channelId);
          nextSegments.push(...result.segments);
          allFoundEmotes.push(...result.emotes);
        } else {
          // This segment is already an emote, so just pass it through
          nextSegments.push(segment);
        }
      }
      finalSegments = nextSegments;
    }

    // A final pass to merge consecutive text segments
    const mergedSegments: MessageSegment[] = [];
    let currentTextSegment: MessageSegment | null = null;

    for (const segment of finalSegments) {
      if (segment.type === 'text') {
        if (currentTextSegment) {
          currentTextSegment.content += segment.content;
        } else {
          currentTextSegment = { type: 'text', content: segment.content };
        }
      } else {
        if (currentTextSegment) {
          mergedSegments.push(currentTextSegment);
          currentTextSegment = null;
        }
        mergedSegments.push(segment);
      }
    }
    if (currentTextSegment) {
      mergedSegments.push(currentTextSegment);
    }

    return { segments: mergedSegments, emotes: allFoundEmotes };
  }
}