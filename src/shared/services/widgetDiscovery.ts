import { obsClient } from './obsClient';
import { geminiService } from './geminiService';
import { TargetType } from '@/types/universalWidget';
import { logger } from '@/utils/logger';

export class WidgetDiscoveryService {
  private cache: Map<TargetType, string[]> = new Map();
  private cacheExpiry = new Map<TargetType, number>();

  constructor(private cacheTimeout = 30000) {} // 30 seconds default

  async discoverTargets(type: TargetType, description?: string): Promise<string[]> {
    const now = Date.now();
    const cached = this.cache.get(type);
    const expiry = this.cacheExpiry.get(type);

    if (cached && expiry && now < expiry) {
      logger.debug(`Using cached targets for ${type}: ${cached.length} items`);
      return cached;
    }

    try {
      logger.info(`Discovering targets for type: ${type}`);
      const targets = await obsClient.getAvailableTargets(type);
      
      // If no targets found and description provided, try AI suggestions
      if (targets.length === 0 && description) {
        logger.info(`No targets found for ${type}, trying AI suggestions for: ${description}`);
        try {
          const aiConfig = await geminiService.generateWidgetConfigFromPrompt(
            `Suggest possible ${type} targets for OBS based on this description: ${description}. Only return valid target names that might exist in OBS.`
          );
          // Extract target suggestions from AI response
          const aiSuggestions = aiConfig.targetName ? [aiConfig.targetName] : [];
          logger.info(`AI suggested targets: ${aiSuggestions.join(', ')}`);
          return aiSuggestions;
        } catch (aiError) {
          logger.warn('AI target suggestion failed, falling back to empty list:', aiError);
          return [];
        }
      }
      
      this.cache.set(type, targets);
      this.cacheExpiry.set(type, now + this.cacheTimeout);
      logger.info(`Discovered ${targets.length} targets for ${type}`);
      return targets;
    } catch (error) {
      logger.error(`Failed to discover targets for ${type}:`, error);
      // Fallback to AI if error and description provided
      if (description) {
        try {
          logger.info(`OBS discovery failed, trying AI fallback for: ${description}`);
          const aiConfig = await geminiService.generateWidgetConfigFromPrompt(
            `Suggest possible ${type} targets for OBS based on this description: ${description}.`
          );
          return aiConfig.targetName ? [aiConfig.targetName] : [];
        } catch (aiError) {
          logger.error('AI fallback also failed:', aiError);
        }
      }
      return [];
    }
  }

  async discoverAllTargets(): Promise<Record<TargetType, string[]>> {
    const types = Object.values(TargetType);
    const results = {} as Record<TargetType, string[]>;

    await Promise.allSettled(
      types.map(async (type) => {
        results[type] = await this.discoverTargets(type);
      })
    );

    return results;
  }

  clearCache(type?: TargetType) {
    if (type) {
      this.cache.delete(type);
      this.cacheExpiry.delete(type);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }
}

export const widgetDiscoveryService = new WidgetDiscoveryService();