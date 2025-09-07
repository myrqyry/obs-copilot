import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KnobWidget from '../KnobWidget';
import useConnectionsStore from 'store/connectionsStore';
import { ObsClientImpl } from 'services/obsClient';
import { ObsWidgetConfig } from 'types/obs';

// Mock the useConnectionsStore hook
jest.mock('@/store/connectionsStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the ObsClientImpl
const mockObsClient = {
  call: jest.fn(),
  isConnected: jest.fn(),
};

describe('KnobWidget', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset mocks before each test
    mockObsClient.call.mockClear();
    mockObsClient.isConnected.mockClear();

    // Default mock implementation: connected OBS client
    (useConnectionsStore as jest.Mock).mockReturnValue({
      obs: mockObsClient,
      isConnected: true,
    });
    mockObsClient.isConnected.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const baseConfig: ObsWidgetConfig = {
    id: 'test-knob',
    type: 'toggle_mute', // Type doesn't matter for control widgets but is required
    label: 'Test Knob',
    control: {
      kind: 'knob',
      min: 0,
      max: 100,
      step: 1,
      unit: '',
      sourceName: 'Mic/Aux',
      property: 'volume_db',
      sendMethod: 'SetInputVolume',
      debounceMs: 50,
    },
  };

  it('renders correctly with initial config', () => {
    render(<KnobWidget config={baseConfig} />);
    expect(screen.getByLabelText(/Test Knob/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument(); // Knob is rendered as an input type="range"
    expect(screen.getByRole('slider')).toHaveValue('0'); // Initial state is min value
  });

  it('sends debounced value to OBS on onChangeEnd', async () => {
    render(<KnobWidget config={baseConfig} />);
    const knob = screen.getByRole('slider');

    fireEvent.change(knob, { target: { value: '50' } });
    fireEvent.mouseUp(knob);

    // Expect obsClient.call to be called after debounceMs
    await waitFor(() => {
      expect(mockObsClient.call).toHaveBeenCalledTimes(1);
      expect(mockObsClient.call).toHaveBeenCalledWith('SetInputVolume', {
        inputName: 'Mic/Aux',
        inputVolumeDb: 50,
      });
    }, { timeout: 100 }); // Give it a bit more than debounceMs
  });

  it('displays an error message if OBS is not connected', () => {
    mockObsClient.isConnected.mockReturnValue(false);
    (useConnectionsStore as jest.Mock).mockReturnValue({
      obs: mockObsClient,
      isConnected: false,
    });

    render(<KnobWidget config={baseConfig} />);
    const knob = screen.getByRole('slider');

    fireEvent.change(knob, { target: { value: '50' } });
    fireEvent.mouseUp(knob);

    expect(screen.getByText('OBS not connected.')).toBeInTheDocument();
    expect(mockObsClient.call).not.toHaveBeenCalled();
  });

  it('displays an error message if OBS command fails', async () => {
    mockObsClient.call.mockRejectedValueOnce(new Error('OBS error'));

    render(<KnobWidget config={baseConfig} />);
    const knob = screen.getByRole('slider');

    fireEvent.change(knob, { target: { value: '50' } });
    fireEvent.mouseUp(knob);

    await waitFor(() => {
      expect(screen.getByText('OBS command failed: OBS error')).toBeInTheDocument();
    });
  });

  it('updates current value on knob change without immediately calling OBS', () => {
    render(<KnobWidget config={baseConfig} />);
    const knob = screen.getByRole('slider');

    fireEvent.change(knob, { target: { value: '30' } });
    expect(screen.getByRole('slider')).toHaveValue('30');
    expect(mockObsClient.call).not.toHaveBeenCalled(); // Should not call immediately
  });
});