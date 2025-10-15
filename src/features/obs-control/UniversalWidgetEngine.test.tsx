import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import UniversalWidgetEngine from './UniversalWidgetEngine';
import { UniversalWidgetConfig, WidgetControlType } from '@/types/universalWidget';

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the useObsWidget hook
vi.mock('@/hooks/useObsWidget', () => ({
  useObsWidget: (config: UniversalWidgetConfig) => ({
    options: [],
    isLoading: false,
    error: null,
    executeAction: vi.fn(),
    updateState: vi.fn(),
  }),
}));

describe('UniversalWidgetEngine', () => {
  it('should be a dummy test', () => {
    expect(true).toBe(true);
  });

  it('should render the METER widget with the correct width based on valueMapping', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-meter',
      name: 'Test Meter',
      controlType: WidgetControlType.METER,
      action: {
        type: 'obs',
        requestType: 'GetInputVolume',
        resourceId: 'test-input',
      },
      state: {
        value: 150,
      },
      valueMapping: {
        min: 100,
        max: 200,
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    const meterBar = screen.getByLabelText(/Meter Test Meter at/);
    expect(meterBar).toBeInTheDocument();
    // With value 150, min 100, and max 200, the width should be 50%
    // The current implementation will incorrectly calculate it as 150%
    expect(meterBar).toHaveStyle('width: 50%');
  });
});