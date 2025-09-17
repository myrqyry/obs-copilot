import axios from 'axios';
import { resolveTwitchId } from './twitchResolver';
import type { AutomationRule } from '../types/automation';
import { automationService } from './automationService';
import { logger } from '../lib/logger'; // Assuming logger exists

// EventSub event types to support (expand as needed)
export type SupportedEventSubType = 'stream.online' | 'stream.offline' | 'channel.follow' | 'channel.cheer';

// Subscription config
export interface EventSubSubscription {
  id: string;
  type: SupportedEventSubType;
  version: string;
  condition: { broadcaster_user_id: string };
  transport: { method: 'webhook'; callback: string; secret: string };
  created_at: string;
}

// App access token response
interface AppAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class TwitchEventSubService {
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private webhookCallbackUrl: string = ''; // e.g., 'https://yourapp.com/api/eventsub'
  private webhookSecret: string = 'your-webhook-secret'; // Generate securely

  constructor() {
    this.clientId = process.env.VITE_TWITCH_CLIENT_ID || null;
    this.clientSecret = process.env.VITE_TWITCH_CLIENT_SECRET || null; // Secure env var
    this.webhookCallbackUrl = process.env.VITE_EVENTS_SUB_CALLBACK_URL || 'http://localhost:8000/api/eventsub';
  }

  private async getAppAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) { // Refresh 1min early
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Twitch Client ID and Secret required for EventSub');
    }

    try {
      const response = await axios.post<AppAccessTokenResponse>(
        'https://id.twitch.tv/oauth2/token',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
      logger.info('Refreshed Twitch app access token');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get app access token:', error);
      throw new Error('Failed to authenticate with Twitch API');
    }
  }

  // Subscribe to an EventSub event
  async subscribe(
    broadcasterUsername: string,
    eventType: SupportedEventSubType,
    version: string = '1' // Default version
  ): Promise<EventSubSubscription | null> {
    const token = await this.getAppAccessToken();
    const broadcasterId = await resolveTwitchId(broadcasterUsername);

    if (!broadcasterId) {
      logger.error(`Could not resolve broadcaster ID for ${broadcasterUsername}`);
      return null;
    }

    try {
      const response = await axios.post<EventSubSubscription>(
        `https://api.twitch.tv/helix/eventsub/subscriptions`,
        {
          type: eventType,
          version,
          condition: { broadcaster_user_id: broadcasterId },
          transport: {
            method: 'webhook',
            callback: this.webhookCallbackUrl,
            secret: this.webhookSecret,
          },
        },
        {
          headers: {
            'Client-ID': this.clientId!,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const subscription = response.data.data[0];
      logger.info(`Subscribed to ${eventType} for broadcaster ${broadcasterUsername}: ${subscription.id}`);
      return subscription;
    } catch (error: any) {
      logger.error(`Failed to subscribe to ${eventType}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Unsubscribe from an EventSub subscription
  async unsubscribe(subscriptionId: string): Promise<void> {
    const token = await this.getAppAccessToken();

    try {
      await axios.delete(
        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
        {
          headers: {
            'Client-ID': this.clientId!,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      logger.info(`Unsubscribed from EventSub: ${subscriptionId}`);
    } catch (error: any) {
      logger.error(`Failed to unsubscribe:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Process incoming EventSub webhook payload (call this from backend forward)
  async processEventSubPayload(payload: any): Promise<void> {
    const { subscription, event } = payload;

    if (!event || !subscription) {
      console.warn('Invalid EventSub payload');
      return;
    }

    // Map to automation event
    const eventName = `twitch_${subscription.type.replace('.', '_')}`; // e.g., 'twitch_stream_online'
    const eventData = { ...event, subscriptionId: subscription.id };

    // Trigger automation rules
    try {
      await automationService.processEvent(eventName, eventData);
      console.info(`Processed EventSub event: ${subscription.type} for ${event.broadcaster_user_id}`);
    } catch (error) {
      console.error('Failed to process EventSub event:', error);
    }
  }

  // Get active subscriptions (for management UI)
  async getSubscriptions(): Promise<EventSubSubscription[]> {
    const token = await this.getAppAccessToken();

    try {
      interface SubscriptionsResponse {
        data: EventSubSubscription[];
      }
      const response = await axios.get<SubscriptionsResponse>(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
          headers: {
            'Client-ID': this.clientId!,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get subscriptions:', error.response?.data || error.message); // Use console
      return [];
    }
  }
}

export const twitchEventSubService = new TwitchEventSubService();
