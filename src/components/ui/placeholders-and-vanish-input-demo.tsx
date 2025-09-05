"use client";

import { useState } from "react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

const PlaceholdersAndVanishInputDemo = () => {
  const [states, setStates] = useState(Array(4).fill(false));

  const toggle = (index: number) => {
    const updated = [...states];
    updated[index] = !updated[index];
    setStates(updated);
  };

  return (
    <div className="flex gap-6 items-end">
      <PlaceholdersAndVanishInput
        placeholders={[
          "What's the first rule of Fight Club?",
          "Who is Tyler Durden?",
          "Where is Andrew Laeddis Hiding?",
          "Write a Javascript method to reverse a string",
          "How to assemble your own PC?",
        ]}
        onValueChange={(value) => console.log(value)}
        onSubmit={() => console.log("submitted")}
      />
    </div>
  );
};

export default PlaceholdersAndVanishInputDemo;
