export interface ObsData {
    scenes: any[];
    currentProgramScene?: string;
    sources: any[];
    streamStatus?: any;
    recordStatus?: any;
    videoSettings?: any;
}
export declare function buildObsSystemMessage(obsData: ObsData, hotkeys?: any[]): string;
export declare function buildStreamerBotSystemMessage(): string;
export declare function buildMarkdownStylingSystemMessage(): string;
