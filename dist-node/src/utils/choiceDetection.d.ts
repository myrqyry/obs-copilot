export interface ChoiceDetectionResult {
    hasChoices: boolean;
    choices: string[];
    cleanText: string;
    choiceType?: string;
}
export declare function detectChoiceQuestion(text: string, obsData?: any): ChoiceDetectionResult;
export declare function extractChoicesFromText(text: string): string[];
export declare function detectObsChoiceQuestion(text: string, obsData: any): ChoiceDetectionResult;
