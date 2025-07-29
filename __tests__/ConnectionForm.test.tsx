import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionForm } from '../src/components/ConnectionForm';
import * as persistence from '../src/utils/persistence';
import { useConnectionManagerStore } from '../src/store/connectionManagerStore';

// Mock persistence functions
jest.mock('../src/utils/persistence', () => ({
  loadConnectionSettings: jest.fn(),
  saveConnectionSettings: jest.fn(),
  isStorageAvailable: jest.fn(() => true),
}));

// Mock Zustand store
jest.mock('../src/store/connectionManagerStore', () => ({
  useConnectionManagerStore: jest.fn(),
}));

jest.mock('../src/store/apiKeyStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getApiKeyOverride: jest.fn(),
  })),
  ApiService: {
    GEMINI: 'GEMINI',
  },
}));

jest.mock('../src/store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    theme: {
      accent: 'blue',
    },
  })),
}));

describe('ConnectionForm', () => {
  const mockOnConnect = jest.fn();
  const mockOnDisconnect = jest.fn();
  const mockOnGeminiApiKeyChange = jest.fn();
  const mockSetStreamerBotAddress = jest.fn();
  const mockSetStreamerBotPort = jest.fn();
  const mockOnStreamerBotConnect = jest.fn();
  const mockOnStreamerBotDisconnect = jest.fn();

  const defaultProps = {
    onConnect: mockOnConnect,
    onDisconnect: mockOnDisconnect,
    defaultUrl: 'ws://localhost:4455',
    geminiApiKey: '',
    envGeminiApiKey: '',
    onGeminiApiKeyChange: mockOnGeminiApiKeyChange,
    isGeminiClientInitialized: false,
    geminiInitializationError: null,
    streamerBotAddress: 'localhost',
    setStreamerBotAddress: mockSetStreamerBotAddress,
    streamerBotPort: '8080',
    setStreamerBotPort: mockSetStreamerBotPort,
    onStreamerBotConnect: mockOnStreamerBotConnect,
    onStreamerBotDisconnect: mockOnStreamerBotDisconnect,
    isStreamerBotConnected: false,
    isStreamerBotConnecting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (persistence.loadConnectionSettings as jest.Mock).mockReturnValue({});
    (useConnectionManagerStore as jest.Mock).mockReturnValue({
      isConnected: false,
      isConnecting: false,
      connectError: null,
    });
  });

  it('renders correctly with default values', () => {
    render(<ConnectionForm {...defaultProps} />);

    expect(screen.getByLabelText(/WebSocket URL/i)).toHaveValue('ws://localhost:4455');
    expect(screen.getByLabelText(/Requires password/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Auto-connect/i)).not.toBeChecked();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('updates address input on change', async () => {
    render(<ConnectionForm {...defaultProps} />);
    const addressInput = screen.getByLabelText(/WebSocket URL/i);
    await userEvent.type(addressInput, 'ws://192.168.1.100');
    expect(addressInput).toHaveValue('ws://localhost:4455ws://192.168.1.100');
  });

  it('shows password field when "Requires password" is checked', async () => {
    render(<ConnectionForm {...defaultProps} />);
    const passwordCheckbox = screen.getByLabelText(/Requires password/i);
    await userEvent.click(passwordCheckbox);
    expect(screen.getByPlaceholderText('Enter OBS WebSocket password')).toBeInTheDocument();
  });

  it('calls onConnect with correct values on form submission', async () => {
    render(<ConnectionForm {...defaultProps} />);
    const passwordCheckbox = screen.getByLabelText(/Requires password/i);
    await userEvent.click(passwordCheckbox);
    const passwordInput = screen.getByPlaceholderText('Enter OBS WebSocket password');
    await userEvent.type(passwordInput, 'testpass');

    fireEvent.submit(screen.getByText('Connect'));

    await waitFor(() => {
      expect(mockOnConnect).toHaveBeenCalledWith('ws://localhost:4455', 'testpass');
    });
  });

  it('calls onDisconnect when disconnect button is clicked', async () => {
    (useConnectionManagerStore as jest.Mock).mockReturnValue({
      isConnected: true,
      isConnecting: false,
      connectError: null,
    });
    render(<ConnectionForm {...defaultProps} />);
    const disconnectButton = screen.getByLabelText(/Disconnect from OBS/i);
    await userEvent.click(disconnectButton);
    expect(mockOnDisconnect).toHaveBeenCalledTimes(1);
  });

  it('displays connection error', () => {
    (useConnectionManagerStore as jest.Mock).mockReturnValue({
      isConnected: false,
      isConnecting: false,
      connectError: 'Connection refused',
    });
    render(<ConnectionForm {...defaultProps} />);
    fireEvent.submit(screen.getByText('Connect'));
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('handles auto-connect checkbox change', async () => {
    render(<ConnectionForm {...defaultProps} />);
    const autoConnectCheckbox = screen.getByLabelText(/Auto-connect/i);
    await userEvent.click(autoConnectCheckbox);
    expect(autoConnectCheckbox).toBeChecked();
    expect(persistence.saveConnectionSettings).toHaveBeenCalledWith(expect.objectContaining({ autoConnect: true }));
  });
});