"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui";
import { Mic, X } from "lucide-react";

interface VoiceInputProps extends React.HTMLAttributes<HTMLButtonElement> {
  onRecordStart?: () => void;
  onRecordStop?: (audioBlob: Blob) => void;
}

const VoiceInput = React.forwardRef<HTMLButtonElement, VoiceInputProps>(
  ({ className, onRecordStart, onRecordStop, ...props }, ref) => {
    const [isRecording, setIsRecording] = React.useState(false);
    const [recorder, setRecorder] = React.useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = React.useState<Blob[]>([]);

    const startRecording = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            const newRecorder = new MediaRecorder(stream);
            newRecorder.start();
            setRecorder(newRecorder);
            setAudioChunks([]);
            onRecordStart?.();
            setIsRecording(true);
          })
          .catch((error) => {
            console.error("Could not start audio recording:", error);
          });
      }
    };

    const stopRecording = () => {
      if (recorder) {
        recorder.stop();
        setIsRecording(false);
      }
    };

    recorder?.addEventListener("dataavailable", (event) => {
      if (event.data) {
        setAudioChunks((prevChunks) => [...prevChunks, event.data]);
      }
    });

    recorder?.addEventListener("stop", () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        onRecordStop?.(audioBlob);
      }
    });

    return (
      <Button
        ref={ref}
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-full p-2",
          isRecording ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground",
          className
        )}
        onClick={() => {
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        }}
        {...props}
      >
        {isRecording ? (
          <>
            <X className="size-4" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Mic className="size-4" />
            <span>Record</span>
          </>
        )}
      </Button>
    );
  }
);
VoiceInput.displayName = "VoiceInput";

export { VoiceInput };
