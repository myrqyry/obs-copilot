"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const CheckboxDemo = () => {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(false);

  const handleCheckedChange = (newChecked: boolean | 'indeterminate') => {
    setChecked(newChecked);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-96">
        <h1 className="text-2xl font-semibold mb-4">Checkbox Demo</h1>
        <Checkbox
          id="example-checkbox"
          label="I agree to the terms and conditions"
          checked={checked}
          onCheckedChange={handleCheckedChange}
        />
      </div>
    </div>
  );
};

export default CheckboxDemo;
