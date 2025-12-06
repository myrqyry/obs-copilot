// src/features/obs-control/UniversalWidgetEngine.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UniversalWidgetEngine from './UniversalWidgetEngine';
import { UniversalWidgetConfig, WidgetControlType } from '@/shared/types/universalWidget';

// Mock child components and hooks with proper named exports
vi.mock('@/hooks/useObsWidget', () => ({
    useObsWidget: React.forwardRef((props, ref) => <div ref={ref} {...props} />),
}));

vi.mock('@/components/ui/Button', () => ({
    Button: React.forwardRef((props, ref) => <button ref={ref} {...props} />),
}));

vi.mock('@/components/ui/slider', () => ({
    Slider: React.forwardRef((props, ref) => <input type="range" ref={ref} {...props} />),
}));

vi.mock('@/components/ui/switch', () => ({
    Switch: React.forwardRef((props, ref) => <input type="checkbox" ref={ref} {...props} />),
}));

vi.mock('@/components/ui/select', () => ({
    Select: React.forwardRef((props, ref) => <select ref={ref} {...props} />),
    SelectContent: React.forwardRef((props, ref) => <div ref={ref} {...props} />),
    SelectItem: React.forwardRef((props, ref) => <option ref={ref} {...props} />),
    SelectTrigger: React.forwardRef((props, ref) => <div ref={ref} {...props} />),
    SelectValue: React.forwardRef((props, ref) => <span ref={ref} {...props} />),
}));

vi.mock('@/components/ui/Card', () => ({
    Card: React.forwardRef((props, ref) => <div ref={ref} {...props} />),
    CardContent: React.forwardRef((props, ref) => <div ref={ref} {...props} />),
}));

vi.mock('@/components/ui/label', () => ({
    Label: React.forwardRef((props, ref) => <label ref={ref} {...props} />),
}));

vi.mock('@/utils/logger', () => ({
    logger: React.forwardRef((props, ref) => <div ref={ref} {...props} />),
}));

describe('UniversalWidgetEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
  it('should render a BUTTON widget', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-button',
      name: 'My Button',
      controlType: WidgetControlType.BUTTON,
      action: { type: 'obs', requestType: 'StartStream', resourceId: '' },
    };
    render(<UniversalWidgetEngine config={config} />);
    expect(screen.getByRole('button', { name: /my button/i })).toBeInTheDocument();
  });

  it('should render a SLIDER widget', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-slider',
      name: 'My Slider',
      controlType: WidgetControlType.SLIDER,
      action: { type: 'obs', requestType: 'SetInputVolume', resourceId: 'mic' },
      state: { value: 50 },
      valueMapping: { min: 0, max: 100, step: 1 },
    };
    render(<UniversalWidgetEngine config={config} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText(/my slider/i)).toBeInTheDocument();
  });

  it('should render a SWITCH widget', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-switch',
      name: 'My Switch',
      controlType: WidgetControlType.SWITCH,
      action: { type: 'obs', requestType: 'SetSceneItemEnabled', resourceId: 'item' },
      state: { value: true },
    };
    render(<UniversalWidgetEngine config={config} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/my switch/i)).toBeInTheDocument();
  });

  it('should render a PICKER widget', () => {
    const config: UniversalWidgetConfig = {
      id: 'test-picker',
      name: 'My Picker',
      controlType: WidgetControlType.PICKER,
      action: { type: 'obs', requestType: 'SetCurrentProgramScene', resourceId: 'scene' },
      state: { value: 'Scene 1' },
    };
    render(<UniversalWidgetEngine config={config} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/my picker/i)).toBeInTheDocument();
  });
});
