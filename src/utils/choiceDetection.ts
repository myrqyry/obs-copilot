// Helper functions for detecting and processing choice questions in chat messages

export interface ChoiceDetectionResult {
  hasChoices: boolean;
  choices: string[];
  cleanText: string;
  choiceType?: string;
}

// Helper function to detect general choice questions and OBS-specific choices
export function detectChoiceQuestion(text: string, obsData?: any): ChoiceDetectionResult {
  // First, try OBS-specific choice detection if obsData is available
  if (obsData) {
    const obsChoices = detectObsChoiceQuestion(text, obsData);
    if (obsChoices.hasChoices) {
      return obsChoices;
    }
  }

  // General choice question patterns - only trigger on very specific formats
  const choicePatterns = [
    // Question followed by numbered/lettered options with explicit line breaks
    /(?:which|what|choose|select).+?(?:\?|\:)\s*\n(?:(?:\d+[\.\)]\s*|[a-z][\.\)]\s*|\-\s*|\*\s*).+?\n){2,}/gi,
    // Explicit bullet points or dashes with multiple options
    /(?:choose|select|pick).+?(?:\?|\:)\s*\n(?:(?:[\-\*\•]\s*).+?\n){2,}/gi,
  ];

  for (const pattern of choicePatterns) {
    const match = text.match(pattern);
    if (match) {
      const matchedText = match[0];
      const choices = extractChoicesFromText(matchedText);
      if (choices.length >= 2 && choices.length <= 10) {
        // Clean up the text by removing the choice indicators
        const cleanText = text.replace(pattern, (matched) => {
          return matched.replace(/(?:\d+[\.\)]\s*|[a-z][\.\)]\s*|\-\s*|\*\s*)/gi, '').trim();
        });
        return { hasChoices: true, choices, cleanText, choiceType: 'general' };
      }
    }
  }

  // Only detect "A or B" patterns in very specific contexts (questions or explicit choices)
  // Must have clear question indicators and be in a choice-making context
  const questionIndicators = /(?:which|what|choose|select|pick|would you like|do you want|prefer)/i;
  if (questionIndicators.test(text)) {
    const orPattern = /\b(\w+(?:\s+\w+){0,2})\s+or\s+(\w+(?:\s+\w+){0,2})\b/gi;
    const orMatches = Array.from(text.matchAll(orPattern));
    if (orMatches.length === 1 && orMatches[0]) {
      // Only single "or" choice, not multiple
      const match = orMatches[0];
      const choice1 = match[1].trim();
      const choice2 = match[2].trim();

      // Additional validation: choices should be reasonable length and not common words
      const commonWords = [
        'with',
        'your',
        'the',
        'and',
        'can',
        'will',
        'you',
        'me',
        'we',
        'they',
        'help',
        'today',
      ];
      if (
        choice1.length > 2 &&
        choice2.length > 2 &&
        choice1.length < 30 &&
        choice2.length < 30 &&
        !commonWords.includes(choice1.toLowerCase()) &&
        !commonWords.includes(choice2.toLowerCase())
      ) {
        return {
          hasChoices: true,
          choices: [choice1, choice2],
          cleanText: text,
          choiceType: 'simple-or',
        };
      }
    }
  }

  return { hasChoices: false, choices: [], cleanText: text };
}

// Helper function to extract choices from text with various formats
export function extractChoicesFromText(text: string): string[] {
  const choices: string[] = [];

  // Split by lines and extract choices
  const lines = text.split(/\n|\r\n?/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Remove numbering, lettering, bullets, and dashes
    const cleanLine = trimmedLine
      .replace(/^\d+[\.\)]\s*/, '') // 1. or 1)
      .replace(/^[a-z][\.\)]\s*/i, '') // a. or a) or A.
      .replace(/^[\-\*\•]\s*/, '') // - or * or •
      .trim();

    if (cleanLine && cleanLine.length > 1) {
      choices.push(cleanLine);
    }
  }

  // If no line-based choices found, try splitting by "or"
  if (choices.length === 0) {
    const orSplit = text.split(/\s+or\s+/i);
    if (orSplit.length >= 2) {
      orSplit.forEach((choice) => {
        const cleaned = choice.trim().replace(/^[\-\*\•]\s*/, '');
        if (cleaned && cleaned.length > 1) {
          choices.push(cleaned);
        }
      });
    }
  }

  return choices.filter((choice) => choice.length > 1 && choice.length < 100); // Reasonable length limits
}

// Helper function to detect OBS-specific choice questions and generate relevant options
export function detectObsChoiceQuestion(text: string, obsData: any): ChoiceDetectionResult {
  const lowercaseText = text.toLowerCase();

  // Only trigger on very specific ambiguous response patterns
  const ambiguousPatterns = [
    /which\s+(scene|source|filter|camera|audio)\s+(?:do you want|would you like|should i)/i,
    /be\s+more\s+specific\s+about/i,
    /need\s+to\s+specify\s+which/i,
    /which\s+one\s+do\s+you\s+mean/i,
    /clarify\s+which\s+(scene|source|filter)/i,
    /multiple\s+(scenes|sources|filters|cameras)\s+(?:found|available)/i,
    /there\s+are\s+several\s+(scenes|sources)/i,
    /i\s+found\s+multiple/i,
    /could\s+you\s+specify\s+which/i,
  ];

  const isAmbiguous = ambiguousPatterns.some((pattern) => pattern.test(text));

  // Only proceed if there's a clear ambiguous pattern or very specific command structure
  if (!isAmbiguous) {
    // Check for explicit choice questions only
    const explicitChoicePatterns = [
      /which\s+(scene|source)\s+(?:would you like|do you want)/i,
      /select\s+(?:a\s+)?(scene|source|filter)/i,
      /choose\s+(?:a\s+)?(scene|source|filter)/i,
    ];

    const hasExplicitChoice = explicitChoicePatterns.some((pattern) => pattern.test(text));
    if (!hasExplicitChoice) {
      return { hasChoices: false, choices: [], cleanText: text };
    }
  }

  // Scene-related choices - only for explicit scene selection
  if (
    (isAmbiguous && lowercaseText.includes('scene')) ||
    lowercaseText.includes('which scene') ||
    lowercaseText.includes('select scene') ||
    lowercaseText.includes('choose scene')
  ) {
    const scenes =
      obsData.scenes
        ?.map((scene: any) => scene.sceneName)
        .filter((name: string) => name !== obsData.currentProgramScene) || [];
    if (scenes.length > 1) {
      return {
        hasChoices: true,
        choices: scenes.slice(0, 6),
        cleanText: text,
        choiceType: 'scene',
      };
    }
  }

  // Source choices - only for explicit source selection (not status updates)
  if (
    (isAmbiguous && lowercaseText.includes('source')) ||
    lowercaseText.includes('which source') ||
    lowercaseText.includes('select source') ||
    lowercaseText.includes('choose source')
  ) {
    const sources = obsData.sources?.map((source: any) => source.sourceName) || [];
    if (sources.length > 1) {
      return {
        hasChoices: true,
        choices: sources.slice(0, 8),
        cleanText: text,
        choiceType: 'source',
      };
    }
  }

  // Camera source choices - only when explicitly asking about cameras
  if (
    (isAmbiguous && lowercaseText.includes('camera')) ||
    lowercaseText.includes('which camera') ||
    lowercaseText.includes('select camera')
  ) {
    const cameraSources =
      obsData.sources
        ?.filter(
          (source: any) =>
            source.inputKind === 'dshow_input' ||
            source.sourceName.toLowerCase().includes('camera') ||
            source.sourceName.toLowerCase().includes('webcam') ||
            source.sourceName.toLowerCase().includes('cam'),
        )
        .map((source: any) => source.sourceName) || [];

    if (cameraSources.length > 1) {
      return {
        hasChoices: true,
        choices: cameraSources,
        cleanText: text,
        choiceType: 'camera-source',
      };
    }
  }

  // Text source choices - only when explicitly asking for text source selection
  if (
    (isAmbiguous && lowercaseText.includes('text source')) ||
    lowercaseText.includes('which text source') ||
    lowercaseText.includes('select text source') ||
    lowercaseText.includes('choose text source')
  ) {
    const textSources =
      obsData.sources
        ?.filter(
          (source: any) =>
            source.inputKind === 'text_gdiplus_v2' ||
            source.inputKind === 'text_ft2_source_v2' ||
            source.sourceName.toLowerCase().includes('text'),
        )
        .map((source: any) => source.sourceName) || [];

    if (textSources.length > 1) {
      return { hasChoices: true, choices: textSources, cleanText: text, choiceType: 'text-source' };
    }
  }

  // Audio source choices - only when explicitly asking about audio
  if (
    (isAmbiguous && lowercaseText.includes('audio')) ||
    lowercaseText.includes('which audio') ||
    lowercaseText.includes('select audio') ||
    lowercaseText.includes('which microphone') ||
    lowercaseText.includes('which mic')
  ) {
    const audioSources =
      obsData.sources
        ?.filter(
          (source: any) =>
            source.inputKind?.includes('audio') ||
            source.inputKind?.includes('wasapi') ||
            source.inputKind?.includes('dshow') ||
            source.sourceName.toLowerCase().includes('audio') ||
            source.sourceName.toLowerCase().includes('mic'),
        )
        .map((source: any) => source.sourceName) || [];

    if (audioSources.length > 1) {
      return {
        hasChoices: true,
        choices: audioSources,
        cleanText: text,
        choiceType: 'audio-source',
      };
    }
  }

  // Screen/display capture choices - only when explicitly asking
  if (
    (isAmbiguous && lowercaseText.includes('screen')) ||
    lowercaseText.includes('which screen') ||
    lowercaseText.includes('select screen') ||
    lowercaseText.includes('which display') ||
    lowercaseText.includes('which monitor')
  ) {
    const screenSources =
      obsData.sources
        ?.filter(
          (source: any) =>
            source.inputKind === 'monitor_capture' ||
            source.inputKind === 'window_capture' ||
            source.sourceName.toLowerCase().includes('screen') ||
            source.sourceName.toLowerCase().includes('display') ||
            source.sourceName.toLowerCase().includes('monitor'),
        )
        .map((source: any) => source.sourceName) || [];

    if (screenSources.length > 1) {
      return {
        hasChoices: true,
        choices: screenSources,
        cleanText: text,
        choiceType: 'screen-source',
      };
    }
  }

  return { hasChoices: false, choices: [], cleanText: text };
}
