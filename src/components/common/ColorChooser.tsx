import React from 'react';

export interface ColorChooserProps {
  label: string;
  colorsHexMap: Record<string, string>;
  selectedColorName: string;
  themeKey?: string;
  colorNameTypeGuard: (name: string) => boolean;
  onChange: (color: string) => void;
}

export const ColorChooser: React.FC<ColorChooserProps> = ({
  label,
  colorsHexMap,
  selectedColorName,
  colorNameTypeGuard,
  onChange,
}) => {
  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-primary">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(colorsHexMap).map((colorNameIter) => {
          if (!colorNameTypeGuard(colorNameIter)) return null;
          const hex = colorsHexMap[colorNameIter];
          const isSelected = selectedColorName === colorNameIter;
          return (
            <button
              key={colorNameIter}
              onClick={() => onChange(colorNameIter)}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none ${
                isSelected ? 'ring-2 ring-offset-2 ring-offset-background border-border' : 'border-border hover:border-muted-foreground'
              }`}
              style={{
                // force the swatch background to the exact color and avoid any background-image
                backgroundColor: hex,
                backgroundImage: 'none',
                mixBlendMode: 'normal',
                borderColor: isSelected ? hex : undefined,
              }}
              aria-label={`Select ${colorNameIter} for ${label}`}
              title={colorNameIter}
            />
          );
        })}
      </div>
    </div>
  );
};
