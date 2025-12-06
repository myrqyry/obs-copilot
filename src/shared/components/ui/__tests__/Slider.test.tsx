import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from '../slider'; // Assuming slider.tsx is in the same directory

describe('Slider', () => {
  it('renders with label and value', () => {
    render(<Slider label="Volume" min={0} max={100} value={50} onChange={() => {}} />);
    expect(screen.getByLabelText(/Volume/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveValue('50');
  });

  it('displays unit when provided', () => {
    render(<Slider label="Temperature" min={0} max={100} value={25} unit="°C" onChange={() => {}} />);
    expect(screen.getByText('(25°C)')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<Slider label="Brightness" min={0} max={100} value={50} onChange={handleChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('calls onChangeEnd when value commit (mouse up) occurs', () => {
    const handleChangeEnd = jest.fn();
    render(<Slider label="Level" min={0} max={100} value={50} onChange={() => {}} onChangeEnd={handleChangeEnd} />);
    const slider = screen.getByRole('slider');
    fireEvent.mouseUp(slider, { target: { value: '60' } });
    expect(handleChangeEnd).toHaveBeenCalledWith(60);
  });

  it('disables the slider when disabled prop is true', () => {
    render(<Slider label="Disabled Slider" min={0} max={100} value={50} onChange={() => {}} disabled />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<Slider label="Custom" min={0} max={100} value={50} onChange={() => {}} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});