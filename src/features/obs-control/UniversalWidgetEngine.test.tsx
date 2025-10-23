// src/features/obs-control/UniversalWidgetEngine.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import UniversalWidgetEngine from './UniversalWidgetEngine';
import { UniversalWidgetConfig, WidgetControlType } from '@/types/universalWidget';
import { useObsWidget } from '@/hooks/useObsWidget';

// Mock the logger first
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the useObsWidget hook completely
vi.mock('@/hooks/useObsWidget', () => ({
  useObsWidget: vi.fn(() => ({
    options: ['Option 1', 'Option 2'],
    isLoading: false,
    error: null,
    executeAction: vi.fn(),
    updateState: vi.fn(),
    generateConfig: vi.fn(),
  })),
}));

// Mock all UI components with proper React components
vi.mock('@/components/ui/Button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(
    ({ children, onClick, className, disabled, ...props }, ref) => (
      <button
        ref={ref}
        onClick={onClick}
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: React.forwardRef<HTMLDivElement, any>(
    ({ children, className, ...props }, ref) => (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  ),
  CardContent: React.forwardRef<HTMLDivElement, any>(
    ({ children, className, ...props }, ref) => (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  ),
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: React.forwardRef<HTMLInputElement, any>(
    ({ value, onValueChange, min, max, step, disabled, className, ...props }, ref) => (
      <input
        ref={ref}
        type="range"
        value={Array.isArray(value) ? value[0] : value}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={className}
        {...props}
      />
    )
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: React.forwardRef<HTMLInputElement, any>(
    ({ checked, onCheckedChange, disabled, ...props }, ref) => (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        {...props}
      />
    )
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-root" data-value={value}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value, onClick }: any) => (
    <div data-testid="select-item" data-value={value} onClick={onClick}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div data-testid="select-trigger" className={className}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: React.forwardRef<HTMLLabelElement, any>(
    ({ children, className, ...props }, ref) => (
      <label ref={ref} className={className} {...props}>
        {children}
      </label>
    )
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(
    ({ value, onChange, disabled, className, ...props }, ref) => (
      <input
        ref={ref}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={className}
        {...props}
      />
    )
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: React.forwardRef<HTMLSpanElement, any>(
    ({ children, className, variant, ...props }, ref) => (
      <span
        ref={ref}
        className={className}
        data-variant={variant}
        {...props}
      >
        {children}
      </span>
    )
  ),
}));

describe('UniversalWidgetEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-button',
      name: 'Test Button',
      controlType: WidgetControlType.BUTTON,
      action: {
        type: 'obs',
        requestType: 'StartStream',
        resourceId: 'test-resource',
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('should render the METER widget with correct width calculation', () => {
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

    // Look for the meter label
    expect(screen.getByText('Test Meter')).toBeInTheDocument();

    // Look for the percentage display (should be 50%)
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check the meter bar exists
    const meterBar = screen.getByLabelText(/Meter Test Meter at 50%/);
    expect(meterBar).toBeInTheDocument();
    expect(meterBar).toHaveStyle('width: 50%');
  });

  it('should render SWITCH widget correctly', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-switch',
      name: 'Test Switch',
      controlType: WidgetControlType.SWITCH,
      action: {
        type: 'obs',
        requestType: 'SetSceneItemEnabled',
        resourceId: 'test-scene-item',
      },
      state: {
        value: true,
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    const switchElement = screen.getByRole('checkbox');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toBeChecked();
    expect(screen.getByText('Test Switch')).toBeInTheDocument();
  });

  it('should render SLIDER widget correctly', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-slider',
      name: 'Test Slider',
      controlType: WidgetControlType.SLIDER,
      action: {
        type: 'obs',
        requestType: 'SetInputVolume',
        resourceId: 'test-input',
      },
      state: {
        value: 75,
      },
      valueMapping: {
        min: 0,
        max: 100,
        step: 1,
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('75');
    expect(screen.getByText('Test Slider')).toBeInTheDocument();
  });

  it('should render PICKER widget with options', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-picker',
      name: 'Test Picker',
      controlType: WidgetControlType.PICKER,
      action: {
        type: 'obs',
        requestType: 'SetCurrentProgramScene',
        resourceId: 'test-scene',
      },
      state: {
        value: 'Option 1',
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    expect(screen.getByTestId('select-root')).toBeInTheDocument();
    expect(screen.getByText('Test Picker')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (useObsWidget as vi.Mock).mockReturnValue({
      options: [],
      isLoading: true,
      error: null,
      executeAction: vi.fn(),
      updateState: vi.fn(),
    });

    const config: UniversalWidgetConfig = {
      id: 'test-loading',
      name: 'Test Loading',
      controlType: WidgetControlType.BUTTON,
      action: {
        type: 'obs',
        requestType: 'StartStream',
        resourceId: 'test-resource',
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Test Loading')).toBeInTheDocument();
  });

  it('should show error state', () => {
    (useObsWidget as vi.Mock).mockReturnValue({
      options: [],
      isLoading: false,
      error: 'Connection failed',
      executeAction: vi.fn(),
      updateState: vi.fn(),
    });

    const config: UniversalWidgetConfig = {
      id: 'test-error',
      name: 'Test Error',
      controlType: WidgetControlType.BUTTON,
      action: {
        type: 'obs',
        requestType: 'StartStream',
        resourceId: 'test-resource',
      },
    };

    render(<UniversalWidgetEngine config={config} />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Test Error')).toBeInTheDocument();
  });
});
