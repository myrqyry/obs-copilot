"use client";

import { InlineDropdown } from "@/components/ui/inline-dropdown";

const InlineDropdownDemo = () => {
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  const handleSelect = (value: string) => {
    console.log("Selected:", value);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-96">
        <h1 className="text-2xl font-semibold mb-4">Inline Dropdown Demo</h1>
        <InlineDropdown
          options={options}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
};

export default InlineDropdownDemo;
