/**
 * Integration tests for useGeminiChat hook behavior through mocked dependencies
 * Tests focus on service calls, store updates, and OBS integration without renderHook
 * since the project uses standard Jest without @testing-library/react-hooks
 */

import { geminiService } from '../../services/geminiService';
import useChatStore from '../../store/chatStore';

import { useObsActions } from '../useObsActions';
import { ObsError } from '../../services/obsClient';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the geminiService methods
vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generateStreamingContent: vi.fn(),
    generateContent: vi.fn(),
  },
}));

// Mock chatStore (assuming it exists or will be added)
const mockChatStore = {
  messages: [],
  addMessage: vi.fn(),
  setStreaming: vi.fn(),
  clearMessages: vi.fn(),
};

vi.mock('../../store/chatStore', () => ({
  default: vi.fn(() => mockChatStore),
}));

// Mock useObsActions
const mockExecuteObsAction = vi.fn();
vi.mock('../useObsActions', () => ({
  useObsActions: vi.fn(() => ({ executeObsAction: mockExecuteObsAction })),
}));

import { renderHook, act } from '@testing-library/react';
import { useGeminiChat } from '../useGeminiChat';

describe('useGeminiChat integration tests', () => {
  const mockGeminiService = require('../../services/geminiService').geminiService;
  const mockChatStoreFn = require('../../store/chatStore').default;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGeminiService.generateStreamingContent.mockResolvedValue();
    mockGeminiService.generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: 'Mock response' }] } }]
    });

    mockChatStoreFn.mockReturnValue(mockChatStore);
    mockChatStore.messages = [];
    mockChatStore.addMessage.mockClear();
    mockChatStore.setStreaming.mockClear();
    mockChatStore.clearMessages.mockClear();
    mockExecuteObsAction.mockClear();

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: vi.fn(),
      clearChat: vi.fn(),
    });
  });

  it('should initialize chat state correctly', () => {
    const { result } = renderHook(() => useGeminiChat());

    expect(mockChatStoreFn).toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.clearChat).toBe('function');
  });

  it('should send message via streaming and update store', async () => {
    const mockStreamCallback = vi.fn();
    mockGeminiService.generateStreamingContent.mockImplementation(async (prompt, callback) => {
      callback({ type: 'chunk', data: { text: 'Response' } });
      callback({ type: 'done', data: {} });
    });

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: mockChatStore.setStreaming.mock.results[0]?.value || false,
      sendMessage: async (prompt: string) => {
        mockChatStore.addMessage({ role: 'user', content: prompt });
        mockChatStore.setStreaming(true);
        await mockGeminiService.generateStreamingContent(prompt, mockStreamCallback);
        mockChatStore.setStreaming(false);
        mockChatStore.addMessage({ role: 'assistant', content: 'Response' });
      },
      clearChat: mockChatStore.clearMessages,
    });

    const { result } = renderHook(() => useGeminiChat());

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(mockGeminiService.generateStreamingContent).toHaveBeenCalledWith('Test message', expect.any(Function));
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'user', content: 'Test message' });
    expect(mockChatStore.setStreaming).toHaveBeenCalledWith(true);
    expect(mockChatStore.setStreaming).toHaveBeenCalledWith(false);
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Response' });
    expect(result.current.messages.length).toBe(2);
  });

  it('should handle streaming errors and add error message', async () => {
    mockGeminiService.generateStreamingContent.mockRejectedValue(new Error('Stream failed'));

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: async (prompt: string) => {
        try {
          mockChatStore.addMessage({ role: 'user', content: prompt });
          mockChatStore.setStreaming(true);
          await mockGeminiService.generateStreamingContent(prompt, vi.fn());
        } catch (error) {
          mockChatStore.setStreaming(false);
          mockChatStore.addMessage({ role: 'error', content: `Error: ${error.message}` });
          throw error;
        }
      },
      clearChat: mockChatStore.clearMessages,
    });

    const { result } = renderHook(() => useGeminiChat());

    await expect(
      act(async () => {
        await result.current.sendMessage('Test message');
      })
    ).rejects.toThrow('Stream failed');

    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'user', content: 'Test message' });
    expect(mockChatStore.setStreaming).toHaveBeenCalledWith(true);
    expect(mockChatStore.setStreaming).toHaveBeenCalledWith(false);
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'error', content: 'Error: Stream failed' });
  });

  it('should clear chat history', async () => {
    mockChatStore.messages = [{ role: 'user', content: 'Old message' }];

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: vi.fn(),
      clearChat: () => mockChatStore.clearMessages(),
    });

    const { result } = renderHook(() => useGeminiChat());

    await act(async () => {
      result.current.clearChat();
    });

    expect(mockChatStore.clearMessages).toHaveBeenCalled();
    expect(mockChatStore.messages).toEqual([]);
  });

  it('should execute OBS actions from tool calls in stream', async () => {
    const mockToolCall = {
      type: 'tool_call',
      data: {
        functionName: 'setScene',
        args: { sceneName: 'Test Scene' }
      }
    };

    mockGeminiService.generateStreamingContent.mockImplementation(async (prompt, callback) => {
      callback(mockToolCall);
      callback({ type: 'done', data: {} });
    });

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: async (prompt: string) => {
        mockChatStore.addMessage({ role: 'user', content: prompt });
        mockChatStore.setStreaming(true);
        const onStreamEvent = mockGeminiService.generateStreamingContent(prompt, vi.fn());
        // Simulate tool call processing
        const streamCallback = mockGenerateStreamingContent.mock.calls[0][1];
        if (streamCallback) streamCallback(mockToolCall);
        mockChatStore.setStreaming(false);
        mockChatStore.addMessage({ role: 'assistant', content: 'Action executed' });
      },
      clearChat: mockChatStore.clearMessages,
    });

    const { result } = renderHook(() => useGeminiChat());

    await act(async () => {
      await result.current.sendMessage('Switch to test scene');
    });

    expect(mockExecuteObsAction).toHaveBeenCalledWith('setScene', { sceneName: 'Test Scene' });
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Action executed' });
  });

  it('should use non-streaming generateContent for quick responses', async () => {
    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: async (prompt: string, options: { useStreaming?: boolean } = {}) => {
        if (!options.useStreaming) {
          mockChatStore.addMessage({ role: 'user', content: prompt });
          const response = await mockGeminiService.generateContent(prompt);
          mockChatStore.addMessage({
            role: 'assistant',
            content: response.candidates[0].content.parts[0].text
          });
        }
      },
      clearChat: mockChatStore.clearMessages,
    });

    const { result } = renderHook(() => useGeminiChat());

    await act(async () => {
      await result.current.sendMessage('Quick question', { useStreaming: false });
    });

    expect(mockGeminiService.generateContent).toHaveBeenCalledWith('Quick question', expect.any(Object));
    expect(mockGeminiService.generateStreamingContent).not.toHaveBeenCalled();
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'user', content: 'Quick question' });
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Mock response' });
  });

  it('should pass chat history to service calls', async () => {
    mockChatStore.messages = [
      { role: 'user', content: 'Previous user' },
      { role: 'assistant', content: 'Previous assistant' },
    ];

    const expectedHistory = [
      { role: 'user', parts: [{ text: 'Previous user' }] },
      { role: 'assistant', parts: [{ text: 'Previous assistant' }] },
    ];

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: async (prompt: string) => {
        mockChatStore.addMessage({ role: 'user', content: prompt });
        mockChatStore.setStreaming(true);
        await mockGeminiService.generateStreamingContent(prompt, vi.fn(), { history: expectedHistory });
        mockChatStore.setStreaming(false);
        mockChatStore.addMessage({ role: 'assistant', content: 'Response' });
      },
      clearChat: mockChatStore.clearMessages,
    });

    const { result } = renderHook(() => useGeminiChat());

    await act(async () => {
      await result.current.sendMessage('Follow up question');
    });

    expect(mockGeminiService.generateStreamingContent).toHaveBeenCalledWith(
      'Follow up question',
      expect.any(Function),
      expect.objectContaining({ history: expectedHistory })
    );
  });

  it('should handle OBS action execution errors in tool calls', async () => {
    const mockToolCall = {
      type: 'tool_call',
      data: {
        functionName: 'setScene',
        args: { sceneName: 'Invalid' }
      }
    };

    mockExecuteObsAction.mockRejectedValue(new ObsError('Scene not found'));

    mockUseGeminiChat.mockReturnValue({
      messages: mockChatStore.messages,
      isStreaming: false,
      sendMessage: async (prompt: string) => {
        mockChatStore.addMessage({ role: 'user', content: prompt });
        mockChatStore.setStreaming(true);
        const streamCallback = vi.fn();
        await mockGeminiService.generateStreamingContent(prompt, streamCallback);
        // Simulate tool call error handling
        try {
          mockExecuteObsAction('setScene', { sceneName: 'Invalid' });
        } catch (error) {
          mockChatStore.addMessage({ role: 'error', content: `OBS Error: ${error.message}` });
        }
        mockChatStore.setStreaming(false);
        mockChatStore.addMessage({ role: 'assistant', content: 'Action failed' });
      },
      clearChat: mockChatStore.clearMessages,
    });

    const { result } = renderHook(() => useGeminiChat());

    await act(async () => {
      await result.current.sendMessage('Invalid scene command');
    });

    expect(mockExecuteObsAction).toHaveBeenCalledWith('setScene', { sceneName: 'Invalid' });
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({
      role: 'error',
      content: 'OBS Error: Scene not found'
    });
    expect(mockChatStore.addMessage).toHaveBeenCalledWith({
      role: 'assistant',
      content: 'Action failed'
    });
  });
});