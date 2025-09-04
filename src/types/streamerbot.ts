/**
 * Types for Streamer.bot integration
 *
 * This file provides comprehensive TypeScript interfaces and types that
 * describe configuration, lifecycle, events, API responses, and errors
 * related to the Streamer.bot integration used across the project.
 *
 * These types are designed to be extensible and to align with the patterns
 * used in other `src/types/*.ts` files in this repository.
 */

/**
 * Possible states for a Streamer.bot connection.
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

/**
 * Options used to initialize a Streamer.bot client instance.
 */
export interface StreamerBotClientOptions {
  /** Hostname or IP of Streamer.bot (e.g., 'localhost') */
  host?: string;
  /** Port number for the Streamer.bot WebSocket server (e.g., 8080) */
  port?: number;
  /** Optional password for the Streamer.bot WebSocket if configured */
  password?: string;
  /** Use secure WebSocket (wss) when true */
  secure?: boolean;
  /** Automatically attempt to reconnect when disconnected */
  autoReconnect?: boolean;
  /** Interval between reconnect attempts in milliseconds */
  reconnectIntervalMs?: number;
  /** Connection timeout in milliseconds */
  timeoutMs?: number;
  /** Optional additional client metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Explicit connection configuration saved in settings or passed to connect()
 */
export interface StreamerBotConnectionConfig {
  host: string;
  port: number;
  /** Scheme to use when constructing the connection URL */
  scheme?: 'ws' | 'wss';
  password?: string;
  /** Optional WebSocket path (defaults to '/') */
  path?: string;
  /** Optional TLS flag (synonym for scheme === 'wss') */
  tls?: boolean;
}

/**
 * Info provided by the server after a successful connection.
 */
export interface StreamerBotInfo {
  id?: string;
  name?: string;
  version?: string;
  serverTime?: string;
  features?: string[];
  actionsCount?: number;
  raw?: Record<string, unknown>;
}

/**
 * Categories of events emitted by Streamer.bot
 */
export type EventCategory =
  | 'Twitch'
  | 'Chat'
  | 'OBS'
  | 'Action'
  | 'Custom'
  | 'System';

/**
 * Descriptor for a single subscription to Streamer.bot events
 */
export interface SubscriptionDescriptor {
  /** Unique id for this subscription */
  id?: string;
  category?: EventCategory;
  /** Specific event type/name within the category */
  eventType?: string;
  /** Optional filter for the subscription (e.g., channel, actionId) */
  filter?: Record<string, unknown>;
  priority?: number;
  enabled?: boolean;
}

/**
 * Basic chat user representation
 */
export interface ChatUser {
  id?: string;
  username: string;
  displayName?: string;
  roles?: string[];
  badges?: Record<string, number | string>;
  metadata?: Record<string, unknown>;
}

/**
 * Chat message event payload
 */
export interface ChatMessageEvent {
  id?: string;
  category: 'Chat';
  channel?: string;
  user: ChatUser;
  message: string;
  timestamp?: string;
  isModerator?: boolean;
  isSubscriber?: boolean;
  bits?: number;
  emotes?: Array<{ id: string; name: string; indices?: [number, number] }>;
  raw?: Record<string, unknown>;
}

/**
 * Generic user event (join/leave/ban/timeouts)
 */
export interface UserEvent {
  id?: string;
  category: 'Twitch' | 'Chat' | 'System';
  type: 'join' | 'leave' | 'ban' | 'timeout' | string;
  user: ChatUser;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Response for custom events emitted or received via Streamer.bot
 */
export interface CustomEventResponse<T = unknown> {
  /** The name or identifier of the custom event */
  name: string;
  payload: T;
  origin?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Minimal action execution event payload
 */
export interface ActionExecutionEvent {
  id?: string;
  category: 'Action';
  actionId: string;
  actionName?: string;
  args?: Record<string, unknown>;
  status?: 'started' | 'completed' | 'failed' | string;
  result?: unknown;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * OBS related events forwarded through Streamer.bot
 */
export interface ObsForwardedEvent {
  id?: string;
  category: 'OBS';
  type: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Map of event names to strongly typed payloads
 * Extend this interface to add project-specific events.
 */
export interface StreamerBotEventMap {
  chatMessage: ChatMessageEvent;
  userEvent: UserEvent;
  custom: CustomEventResponse<any>;
  actionExecuted: ActionExecutionEvent;
  obsEvent: ObsForwardedEvent;
  // Allow additional event keys with unknown payloads
  [event: string]: unknown;
}

/**
 * Callbacks used during the connection lifecycle
 */
export interface ConnectionLifecycleCallbacks<E extends StreamerBotEventMap = StreamerBotEventMap> {
  /** Called when the connection is established */
  onConnect?: (info: StreamerBotInfo) => void;
  /** Called when the connection is closed */
  onDisconnect?: (code?: number, reason?: string) => void;
  /** Called when an unrecoverable error occurs */
  onError?: (err: StreamerBotError) => void;
  /** Called when an event is received from Streamer.bot */
  onEvent?: <K extends keyof E>(eventName: K, payload: E[K]) => void;
}

/**
 * Single action description returned by getActions()
 */
export interface StreamerBotActionDescriptor {
  id: string;
  name: string;
  description?: string;
  group?: string;
  args?: Array<{
    name: string;
    type?: string;
    default?: unknown;
    description?: string;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Response from listing actions
 */
export interface ActionListResponse {
  actions: StreamerBotActionDescriptor[];
  total?: number;
  raw?: unknown;
}

/**
 * Response from executing an action (DoAction)
 */
export interface RunActionResponse<T = unknown> {
  requestId?: string;
  status: 'ok' | 'error' | string;
  result?: T;
  error?: StreamerBotError;
  raw?: unknown;
}

/**
 * Global variable value representation
 */
export interface GlobalVariableValue<T = unknown> {
  name: string;
  value: T;
  scope: GlobalScope;
  lastUpdated?: string;
}

/**
 * Scopes where global variables can live
 */
export type GlobalScope = 'global' | 'user' | 'channel' | 'session' | 'local';

/**
 * Event subscription structure
 */
export interface EventSubscription {
  [category: string]: string[];
}

/**
 * Response from GetEvents request
 */
export interface GetEventsResponse {
  events: {
    [category: string]: string[];
  };
  raw?: unknown;
}

/**
 * Response from GetInfo request
 */
export interface GetInfoResponse {
  id: string;
  name: string;
  version: string;
  sessionId: string;
  uptime: string;
  raw?: unknown;
}

/**
 * Response from GetBroadcaster request
 */
export interface GetBroadcasterResponse {
  broadcasters: Array<{
    id: string;
    platform: string;
    username: string;
    displayName: string;
  }>;
  raw?: unknown;
}

/**
 * Response from GetActiveViewers request
 */
export interface GetActiveViewersResponse {
  viewers: Array<{
    id: string;
    username: string;
    platform: string;
    lastSeen: string;
  }>;
  raw?: unknown;
}

/**
 * Response from GetCommands request
 */
export interface GetCommandsResponse {
  commands: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
  raw?: unknown;
}

/**
 * Response from GetGlobals request
 */
export interface GetGlobalsResponse {
  globals: Record<string, unknown>;
  raw?: unknown;
}

/**
 * Response from GetGlobal request
 */
export interface GetGlobalResponse {
  value: unknown;
  raw?: unknown;
}

/**
 * Response from TwitchGetUserGlobals request
 */
export interface TwitchGetUserGlobalsResponse {
  users: Record<string, Record<string, unknown>>;
  raw?: unknown;
}

/**
 * Response from TwitchGetUserGlobal request
 */
export interface TwitchGetUserGlobalResponse {
  userId: string;
  variables: Record<string, unknown>;
  raw?: unknown;
}

/**
 * Response from TwitchGetEmotes request
 */
export interface TwitchGetEmotesResponse {
  emotes: Array<{
    id: string;
    name: string;
    images: Record<string, string>;
  }>;
  raw?: unknown;
}

/**
 * Response from YouTubeGetEmotes request
 */
export interface YouTubeGetEmotesResponse {
  emotes: Array<{
    id: string;
    name: string;
    images: Record<string, string>;
  }>;
  raw?: unknown;
}

/**
 * Response from GetCodeTriggers request
 */
export interface GetCodeTriggersResponse {
  triggers: Array<{
    name: string;
    description: string;
  }>;
  raw?: unknown;
}

/**
 * Response from GetCredits request
 */
export interface GetCreditsResponse {
  credits: {
    total: number;
    topUsers: Array<{
      userId: string;
      username: string;
      amount: number;
    }>;
  };
  raw?: unknown;
}

/**
 * Structured error returned by Streamer.bot client operations
 */
export interface StreamerBotError {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Common error codes used by the integration
 */
export type ErrorCode =
  | 'CONNECTION_TIMEOUT'
  | 'AUTH_FAILED'
  | 'NOT_CONNECTED'
  | 'INVALID_RESPONSE'
  | 'ACTION_FAILED'
  | 'SUBSCRIPTION_ERROR'
  | 'UNKNOWN';
