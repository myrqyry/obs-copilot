import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useGeminiChat } from '../useGeminiChat';
import { geminiService } from '../../services/geminiService';
import useChatStore from '../../store/chatStore';
import { useObsActions } from '../useObsActions';

// Mock dependencies
vi.mock('../../services/geminiService');
vi.mock('../../store/chatStore');
vi.mock('../useObsActions');

describe('useGeminiChat Hook', () => {
  // Use vi.mocked to get typed mocks
  const mockedGeminiService = vi.mocked(geminiService);
  const mockedUseChatStore = vi.mocked(useChatStore);
  const mockedUseObsActions = vi.mocked(useObsActions);

  let mockChatStoreActions: any;
  let mockGeminiMessages: any[];

  beforeEach(() => {
    // Reset messages and set up store actions for each test
    mockGeminiMessages = [];
    mockChatStoreActions = {
      addMessage: vi.fn((msg) => mockGeminiMessages.push(msg)),
      setStreaming: vi.fn(),
      clearMessages: vi.fn(() => (mockGeminiMessages = [])),
      updateMessage: vi.fn((id, newContent) => {
        const index = mockGeminiMessages.findIndex(m => m.id === id);
        if (index !== -1) {
          mockGeminiMessages[index] = { ...mockGeminiMessages[index], ...newContent };
        } else {
          mockGeminiMessages.push({ id, ...newContent });
        }
      }),
    };

    // Configure the mock return values
    mockedUseChatStore.mockReturnValue({
      geminiMessages: mockGeminiMessages,
      isGeminiClientInitialized: true,
      actions: mockChatStoreActions,
    } as any);

    mockedUseObsActions.mockReturnValue({
      executeObsAction: vi.fn().mockResolvedValue({}),
    } as any);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call generateStreamingContent and update store on handleSend', async () => {
    const { result } = renderHook(() => useGeminiChat(() => Promise.resolve(), () => {}));
    const onChatInputChange = vi.fn();

    // Mock the streaming response
    mockedGeminiService.generateStreamingContent.mockImplementation(async (prompt, callbacks) => {
      callbacks.onmessage({ id: '123', role: 'assistant', text: 'Streaming response' });
      return { summary: "summary" };
    });

    await act(async () => {
      await result.current.handleSend('Test prompt', onChatInputChange);
    });

    expect(mockChatStoreActions.addMessage).toHaveBeenCalledWith(expect.objectContaining({ role: 'user', text: 'Test prompt' }));
    expect(mockedGeminiService.generateStreamingContent).toHaveBeenCalledWith('Test prompt', expect.any(Object));
    expect(mockChatStoreActions.updateMessage).toHaveBeenCalledWith('123', expect.objectContaining({ text: 'Streaming response' }));
    expect(onChatInputChange).toHaveBeenCalledWith('');
  });

  it('should handle tool calls during streaming', async () => {
    const { result } = renderHook(() => useGeminiChat(() => Promise.resolve(), () => {}));
    const onChatInputChange = vi.fn();
    const { executeObsAction } = mockedUseObsActions();

    // Mock a stream that includes a tool call
    mockedGeminiService.generateStreamingContent.mockImplementation(async (prompt, callbacks) => {
      callbacks.onmessage({
        role: 'assistant',
        text: null,
        toolCalls: [{ name: 'SetScene', args: { sceneName: 'Gaming' } }],
      });
      return { summary: "summary" };
    });

    await act(async () => {
      await result.current.handleSend('Switch to gaming scene', onChatInputChange);
    });

    expect(executeObsAction).toHaveBeenCalledWith('SetScene', { sceneName: 'Gaming' });
  });

  it('should handle errors during streaming and set an error message', async () => {
    const setErrorMessage = vi.fn();
    const { result } = renderHook(() => useGeminiChat(() => Promise.resolve(), setErrorMessage));
    const onChatInputChange = vi.fn();

    const testError = new Error('Streaming failed');
    mockedGeminiService.generateStreamingContent.mockRejectedValue(testError);

    await act(async () => {
      await result.current.handleSend('prompt that fails', onChatInputChange);
    });

    expect(setErrorMessage).toHaveBeenCalledWith(expect.stringContaining('An error occurred while processing your message.'));
  });

  it('should regenerate a response for a given message ID', async () => {
    // Setup initial state in the mock store
    mockGeminiMessages.push(
      { id: '1', role: 'user', text: 'First prompt' },
      { id: '2', role: 'assistant', text: 'First response' }
    );

    const { result } = renderHook(() => useGeminiChat(() => Promise.resolve(), () => {}));
    const onChatInputChange = vi.fn();
    const handleSend = vi.fn();

    await act(async () => {
      await result.current.handleRegenerate('1', onChatInputChange, handleSend);
    });

    expect(onChatInputChange).toHaveBeenCalledWith('First prompt');
    expect(handleSend).toHaveBeenCalledWith('First prompt', onChatInputChange);
    expect(mockGeminiMessages.find(m => m.id === '2')).toBeUndefined();
  });
});