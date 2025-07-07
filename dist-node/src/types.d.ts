export interface OBSScene {
    sceneName: string;
    sceneIndex: number;
}
export interface OBSSource {
    sourceName: string;
    typeName?: string;
    sceneItemId: number;
    sceneItemEnabled: boolean;
    inputKind?: string;
}
export interface OBSData {
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    recordStatus: OBSRecordStatus | null;
    videoSettings: OBSVideoSettings | null;
}
export interface OBSStreamStatus {
    outputActive: boolean;
    outputReconnecting: boolean;
    outputTimecode: string;
    outputDuration: number;
    outputCongestion: number;
    outputBytes: number;
    outputSkippedFrames: number;
    outputTotalFrames: number;
}
export interface OBSRecordStatus {
    outputActive: boolean;
    outputPaused: boolean;
    outputTimecode: string;
    outputDuration: number;
    outputBytes: number;
}
export interface OBSVideoSettings {
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
    fpsNumerator: number;
    fpsDenominator: number;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'system';
    text: string;
    timestamp: Date;
    sources?: GroundingChunk[];
    type?: "source-prompt" | "choice-prompt";
    sourcePrompt?: string;
    showSuggestions?: boolean;
    choices?: string[];
    choiceType?: string;
}
export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}
export declare enum AppTab {
    CONNECTIONS = "Connections",
    OBS_STUDIO = "OBS Studio",
    SETTINGS = "Settings",
    GEMINI = "Gemini",
    STREAMING_ASSETS = "Streaming Assets",
    CREATE = "Create",
    ADVANCED = "Advanced"
}
export declare const catppuccinMochaColors: {
    readonly rosewater: "#f5e0dc";
    readonly flamingo: "#f2cdcd";
    readonly pink: "#f5c2e7";
    readonly mauve: "#cba6f7";
    readonly red: "#f38ba8";
    readonly maroon: "#eba0ac";
    readonly peach: "#fab387";
    readonly yellow: "#f9e2af";
    readonly green: "#a6e3a1";
    readonly teal: "#94e2d5";
    readonly sky: "#89dceb";
    readonly sapphire: "#74c7ec";
    readonly blue: "#89b4fa";
    readonly lavender: "#b4befe";
    readonly text: "#cdd6f4";
    readonly subtext1: "#bac2de";
    readonly subtext0: "#a6adc8";
    readonly overlay2: "#9399b2";
    readonly overlay1: "#7f849c";
    readonly overlay0: "#6c7086";
    readonly surface2: "#585b70";
    readonly surface1: "#45475a";
    readonly surface0: "#313244";
    readonly base: "#1e1e2e";
    readonly mantle: "#181825";
    readonly crust: "#11111b";
};
export type CatppuccinColorName = keyof typeof catppuccinMochaColors;
export type CatppuccinAccentColorName = 'sky' | 'mauve' | 'pink' | 'green' | 'teal' | 'peach' | 'yellow' | 'red' | 'flamingo' | 'rosewater' | 'sapphire' | 'blue' | 'lavender';
export declare const catppuccinAccentColorsHexMap: Record<CatppuccinAccentColorName, string>;
export type CatppuccinSecondaryAccentColorName = CatppuccinAccentColorName;
export declare const catppuccinSecondaryAccentColorsHexMap: Record<CatppuccinSecondaryAccentColorName, string>;
export type CatppuccinChatBubbleColorName = CatppuccinAccentColorName;
export declare const catppuccinChatBubbleColorsHexMap: Record<CatppuccinChatBubbleColorName, string>;
