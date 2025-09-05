import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SliderWidget from '../SliderWidget';
import useConnectionsStore from '@/store/connectionsStore';
import { ObsClientImpl } from '@/services/obsClient';
import { ObsWidgetConfig } from '@/types/obs';

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

describe('SliderWidget', () => {
  beforeEach(() => {
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

  const baseConfig: ObsWidgetConfig = {
    id: 'test-slider',
    type: 'toggle_mute', // Type doesn't matter for control widgets but is required
    label: 'Test Slider',
    control: {
      kind: 'slider',
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      sourceName: 'Desktop Audio',
      property: 'volume_db',
      sendMethod: 'SetInputVolume',
      debounceMs: 50,
    },
  };

  it('renders correctly with initial config', () => {
    render(<SliderWidget config={baseConfig} />);
    expect(screen.getByLabelText(/Test Slider/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveValue('0'); // Initial state is min value
  });

  it('sends debounced value to OBS on onChangeEnd', async () => {
    render(<SliderWidget config={baseConfig} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '50' } });
    fireEvent.mouseUp(slider);

    // Expect obsClient.call to be called after debounceMs
    await waitFor(() => {
      expect(mockObsClient.call).toHaveBeenCalledTimes(1);
      expect(mockObsClient.call).toHaveBeenCalledWith('SetInputVolume', {
        inputName: 'Desktop Audio',
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

    render(<SliderWidget config={baseConfig} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '50' } });
    fireEvent.mouseUp(slider);

    expect(screen.getByText('OBS not connected.')).toBeInTheDocument();
    expect(mockObsClient.call).not.toHaveBeenCalled();
  });

  it('displays an error message if OBS command fails', async () => {
    mockObsClient.call.mockRejectedValueOnce(new Error('OBS error'));

    render(<SliderWidget config={baseConfig} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '50' } });
    fireEvent.mouseUp(slider);

    await waitFor(() => {
      expect(screen.getByText('OBS command failed: OBS error')).toBeInTheDocument();
    });
  });

  it('updates current value on slider change without immediately calling OBS', () => {
    render(<SliderWidget config={baseConfig} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '30' } });
    expect(screen.getByRole('slider')).toHaveValue('30');
    expect(mockObsClient.call).not.toHaveBeenCalled(); // Should not call immediately
  });

  // Test for throttleMs (if implemented)
  // This requires a more complex mock for debounce that can simulate throttling
  // For now, we'll rely on manual inspection or a separate utility test for throttle.
});