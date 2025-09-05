"use client";

import { useState } from "react";
import { VoiceInput } from "@/components/ui/voice-input";

const VoiceInputDemo = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleRecordStart = () => {
    console.log("Recording started");
  };

  const handleRecordStop = (blob: Blob) => {
    setAudioBlob(blob);
    console.log("Recording stopped. Audio blob:", blob);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-semibold mb-4">Voice Input Demo</h1>
      <VoiceInput
        onRecordStart={handleRecordStart}
        onRecordStop={handleRecordStop}
      />
      {audioBlob && (
        <audio
          controls
          src={URL.createObjectURL(audioBlob)}
          className="mt-4"
        />
      )}
    </div>
  );
};

export default VoiceInputDemo;
