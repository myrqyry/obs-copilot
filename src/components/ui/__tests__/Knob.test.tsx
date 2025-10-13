import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Knob } from '../Knob'; // Assuming Knob.tsx is in the same directory
import { vi, describe, it, expect } from 'vitest';

describe('Knob', () => {
  it('renders with label and value', () => {
    render(<Knob id="gain-knob" label="Gain" min={0} max={100} value={50} onChange={() => {}} />);
    expect(screen.getByLabelText(/Gain/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveValue('50'); // Knob is rendered as an input type="range"
  });

  it('displays unit when provided', () => {
    render(<Knob id="frequency-knob" label="Frequency" min={0} max={100} value={25} unit="Hz" onChange={() => {}} />);
    expect(screen.getByText('(25Hz)')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<Knob id="volume-knob" label="Volume" min={0} max={100} value={50} onChange={handleChange} />);
    const knob = screen.getByRole('slider');
    fireEvent.change(knob, { target: { value: '75' } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('calls onChangeEnd when value commit (mouse up) occurs', () => {
    const handleChangeEnd = vi.fn();
    render(<Knob id="pan-knob" label="Pan" min={-100} max={100} value={0} onChange={() => {}} onChangeEnd={handleChangeEnd} />);
    const knob = screen.getByRole('slider');
    fireEvent.mouseUp(knob, { target: { value: '20' } });
    expect(handleChangeEnd).toHaveBeenCalledWith(20);
  });

  it('disables the knob when disabled prop is true', () => {
    render(<Knob id="disabled-knob" label="Disabled Knob" min={0} max={100} value={50} onChange={() => {}} disabled />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<Knob id="custom-knob" label="Custom" min={0} max={100} value={50} onChange={() => {}} className="custom-knob-class" />);
    expect(container.firstChild).toHaveClass('custom-knob-class');
  });
});
