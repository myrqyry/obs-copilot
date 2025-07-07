import React from 'react';
export const ColorChooser = ({ label, colorsHexMap, selectedColorName, themeKey, colorNameTypeGuard, onChange, }) => {
    return (<div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-primary">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(colorsHexMap).map((colorNameIter) => {
            if (!colorNameTypeGuard(colorNameIter))
                return null;
            return (<button key={colorNameIter} onClick={() => onChange && onChange(colorNameIter)} className={`w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none ${selectedColorName === colorNameIter
                    ? 'ring-2 ring-offset-2 ring-offset-background border-border'
                    : 'border-border hover:border-muted-foreground'}`} style={{
                    backgroundColor: colorsHexMap[colorNameIter],
                    borderColor: selectedColorName === colorNameIter
                        ? colorsHexMap[colorNameIter]
                        : undefined,
                }} aria-label={`Select ${colorNameIter} for ${label}`}/>);
        })}
      </div>
    </div>);
};
