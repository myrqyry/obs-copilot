export interface SliderProps {
  id?: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  unit?: string;
}

export interface KnobProps {
  id?: string;
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  size?: number;
  disabled?: boolean;
  className?: string;
  unit?: string;
}