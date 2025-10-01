// Ambient augmentation for @google/genai types used in the project.
// This augments minimal properties that the runtime provides but the
// shipped types may not include.

declare module '@google/genai' {
  export interface LiveServerMessage {
    data?: string;
    serverContent?: any;
    transcription?: {
      text: string;
      language?: string;
    };
  }

  export interface Session {
    sendAudio?: (base64Audio: string) => void;
    sendRealtimeInput?: (payload: any) => void;
    close?: () => void;
  }
}

// If AutomationTab is not picked up by TS module resolution for some reason,
// declare the module path explicitly (this is a no-op if the file exists).
declare module 'src/plugins/automation/AutomationTab' {
  const AutomationTab: any;
  export default AutomationTab;
}

// Also declare relative path for TypeScript module resolution
declare module './AutomationTab' {
  const AutomationTab: any;
  export default AutomationTab;
}
