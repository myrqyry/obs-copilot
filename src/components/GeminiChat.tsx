import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { GoogleGenAI, GenerateContentResponse, Content } from '@google/genai';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '../constants';
import { ChatMessage as BaseChatMessage, GroundingChunk, OBSScene, OBSSource, OBSStreamStatus, OBSVideoSettings, CatppuccinAccentColorName, AppTab } from '../types';
import { OBSWebSocketService } from '../services/obsService';

interface ChatMessage extends BaseChatMessage {
  type?: "source-prompt";
  sourcePrompt?: string;
}

interface GeminiChatProps {
  geminiApiKeyFromInput?: string;
  obsService: OBSWebSocketService;
  flipSides: boolean;
  setFlipSides: (value: boolean) => void;
  obsData: {
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    videoSettings: OBSVideoSettings | null;
  };
  onRefreshData: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;
  chatInputValue: string;
  onChatInputChange: (value: string) => void;
  accentColorName?: CatppuccinAccentColorName;

  messages: ChatMessage[];
  onAddMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  isGeminiClientInitialized: boolean;
  geminiInitializationError: string | null;
  onSetIsGeminiClientInitialized: (status: boolean) => void;
  onSetGeminiInitializationError: (error: string | null) => void;
  activeTab: AppTab;
  streamerName: string | null; // <-- Added new prop
  setGeminiStatus: (status: { status: 'initializing' | 'connected' | 'error' | 'unavailable' | 'missing-key'; message: string } | null) => void;
}

interface GeminiActionResponse {
  obsAction?: ObsAction;
  responseText: string;
  sources?: GroundingChunk[];
}

interface ObsActionBase {
  type: string;
}

interface CreateInputAction extends ObsActionBase {
  type: "createInput";
  inputName: string;
  inputKind: string;
  inputSettings?: object;
  sceneName?: string;
  sceneItemEnabled?: boolean;
}

interface SetInputSettingsAction extends ObsActionBase {
  type: "setInputSettings";
  inputName: string;
  inputSettings: object;
  overlay?: boolean;
}

interface SetSceneItemEnabledAction extends ObsActionBase {
  type: "setSceneItemEnabled";
  sceneName: string;
  sourceName: string;
  sceneItemEnabled: boolean;
  enabled?: boolean;
}

interface GetInputSettingsAction extends ObsActionBase {
  type: "getInputSettings";
  inputName: string;
}

interface GetSceneItemListAction extends ObsActionBase {
  type: "getSceneItemList";
  sceneName: string;
}

interface SetCurrentProgramSceneAction extends ObsActionBase {
  type: "setCurrentProgramScene";
  sceneName: string;
}

interface SetVideoSettingsAction extends ObsActionBase {
  type: "setVideoSettings";
  videoSettings: OBSVideoSettings;
}

interface CreateSceneAction extends ObsActionBase {
  type: "createScene";
  sceneName: string;
}

interface RemoveInputAction extends ObsActionBase {
  type: "removeInput";
  inputName: string;
}

interface SetSceneItemTransformAction extends ObsActionBase {
  type: "setSceneItemTransform";
  sceneName: string;
  sourceName: string;
  transform: {
    positionX?: number;
    positionY?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    alignment?: number;
  };
}

interface CreateSourceFilterAction extends ObsActionBase {
  type: "createSourceFilter";
  sourceName: string;
  filterName: string;
  filterKind: string;
  filterSettings?: object;
}

interface SetInputVolumeAction extends ObsActionBase {
  type: "setInputVolume";
  inputName: string;
  inputVolumeMul?: number;
  inputVolumeDb?: number;
}

interface SetInputMuteAction extends ObsActionBase {
  type: "setInputMute";
  inputName: string;
  inputMuted: boolean;
}

interface StartVirtualCamAction extends ObsActionBase {
  type: "startVirtualCam";
}

interface StopVirtualCamAction extends ObsActionBase {
  type: "stopVirtualCam";
}

interface SaveScreenshotAction extends ObsActionBase {
  type: "saveScreenshot";
  imageFormat: string;
  imageFilePath: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface StartReplayBufferAction extends ObsActionBase {
  type: "startReplayBuffer";
}

interface SaveReplayBufferAction extends ObsActionBase {
  type: "saveReplayBuffer";
}

interface SetSourceFilterIndexAction extends ObsActionBase {
  type: "setSourceFilterIndex";
  sourceName: string;
  filterName: string;
  filterIndex: number;
}

interface SetSourceFilterNameAction extends ObsActionBase {
  type: "setSourceFilterName";
  sourceName: string;
  filterName: string;
  newFilterName: string;
}

interface DuplicateSourceFilterAction extends ObsActionBase {
  type: "duplicateSourceFilter";
  sourceName: string;
  filterName: string;
  newFilterName: string;
}

interface TriggerStudioModeTransitionAction extends ObsActionBase {
  type: "triggerStudioModeTransition";
}

interface SetInputAudioMonitorTypeAction extends ObsActionBase {
  type: "setInputAudioMonitorType";
  inputName: string;
  monitorType: "OBS_MONITORING_TYPE_NONE" | "OBS_MONITORING_TYPE_MONITOR_ONLY" | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT";
}

interface SetSceneItemBlendModeAction extends ObsActionBase {
  type: "setSceneItemBlendMode";
  sceneName: string;
  sourceName: string;
  blendMode: string;
}

interface SetSceneNameAction extends ObsActionBase {
  type: "setSceneName";
  sceneName: string; // The current name of the scene
  newSceneName: string; // The new name for the scene
}

interface RefreshBrowserSourceAction extends ObsActionBase {
  type: "refreshBrowserSource";
  inputName: string;
}

interface GetLogFileListAction extends ObsActionBase {
  type: "getLogFileList";
}

interface GetLogFileAction extends ObsActionBase {
  type: "getLogFile";
  logFile: string;
}

interface SetStudioModeEnabledAction extends ObsActionBase {
  type: "setStudioModeEnabled";
  enabled: boolean;
}

interface ToggleStudioModeAction extends ObsActionBase {
  type: "toggleStudioMode";
}

interface TriggerHotkeyByNameAction extends ObsActionBase {
  type: "triggerHotkeyByName";
  hotkeyName: string;
}

interface TriggerHotkeyByKeySequenceAction extends ObsActionBase {
  type: "triggerHotkeyByKeySequence";
  keyId: string;
  keyModifiers: { shift: boolean, control: boolean, alt: boolean, command: boolean };
}

interface ToggleStreamAction extends ObsActionBase {
  type: "toggleStream";
}

interface ToggleRecordAction extends ObsActionBase {
  type: "toggleRecord";
}

interface GetSourceFilterListAction extends ObsActionBase {
  type: "getSourceFilterList";
  sourceName: string;
}

interface GetSourceFilterDefaultSettingsAction extends ObsActionBase {
  type: "getSourceFilterDefaultSettings";
  filterKind: string;
}

interface GetSourceFilterSettingsAction extends ObsActionBase {
  type: "getSourceFilterSettings";
  sourceName: string;
  filterName: string;
}

interface SetSourceFilterSettingsAction extends ObsActionBase {
  type: "setSourceFilterSettings";
  sourceName: string;
  filterName: string;
  filterSettings: object;
  overlay?: boolean;
}

interface SetSourceFilterEnabledAction extends ObsActionBase {
  type: "setSourceFilterEnabled";
  sourceName: string;
  filterName: string;
  filterEnabled: boolean;
}

interface RemoveSourceFilterAction extends ObsActionBase {
  type: "removeSourceFilter";
  sourceName: string;
  filterName: string;
}

interface GetInputDefaultSettingsAction extends ObsActionBase {
  type: "getInputDefaultSettings";
  inputKind: string;
}

interface GetOutputListAction extends ObsActionBase { type: "getOutputList"; }
interface GetOutputStatusAction extends ObsActionBase { type: "getOutputStatus"; outputName: string; }
interface StartOutputAction extends ObsActionBase { type: "startOutput"; outputName: string; }
interface StopOutputAction extends ObsActionBase { type: "stopOutput"; outputName: string; }
interface GetOutputSettingsAction extends ObsActionBase { type: "getOutputSettings"; outputName: string; }
interface SetOutputSettingsAction extends ObsActionBase { type: "setOutputSettings"; outputName: string; outputSettings: Record<string, any>; }
interface GetSceneTransitionListAction extends ObsActionBase { type: "getSceneTransitionList"; }
interface GetCurrentSceneTransitionAction extends ObsActionBase { type: "getCurrentSceneTransition"; }
interface SetCurrentSceneTransitionAction extends ObsActionBase { type: "setCurrentSceneTransition"; transitionName: string; }
interface SetSceneTransitionDurationAction extends ObsActionBase { type: "setSceneTransitionDuration"; transitionDuration: number; }
interface GetSceneTransitionCursorAction extends ObsActionBase { type: "getSceneTransitionCursor"; }
interface GetMediaInputStatusAction extends ObsActionBase { type: "getMediaInputStatus"; inputName: string; }
interface SetMediaInputCursorAction extends ObsActionBase { type: "setMediaInputCursor"; inputName: string; mediaCursor: number; }
interface OffsetMediaInputCursorAction extends ObsActionBase { type: "offsetMediaInputCursor"; inputName: string; mediaCursorOffset: number; }
interface TriggerMediaInputActionAction extends ObsActionBase { type: "triggerMediaInputAction"; inputName: string; mediaAction: string; }
interface GetCurrentPreviewSceneAction extends ObsActionBase { type: "getCurrentPreviewScene"; }
interface SetCurrentPreviewSceneAction extends ObsActionBase { type: "setCurrentPreviewScene"; sceneName: string; }
interface GetSceneItemLockedAction extends ObsActionBase { type: "getSceneItemLocked"; sceneName: string; sceneItemId: number; }
interface SetSceneItemLockedAction extends ObsActionBase { type: "setSceneItemLocked"; sceneName: string; sceneItemId: number; sceneItemLocked: boolean; }
interface GetSceneItemIndexAction extends ObsActionBase { type: "getSceneItemIndex"; sceneName: string; sceneItemId: number; }
interface SetSceneItemIndexAction extends ObsActionBase { type: "setSceneItemIndex"; sceneName: string; sceneItemId: number; sceneItemIndex: number; }
interface CreateSceneItemAction extends ObsActionBase { type: "createSceneItem"; sceneName: string; sourceName: string; sceneItemEnabled?: boolean; }
interface RemoveSceneItemAction extends ObsActionBase { type: "removeSceneItem"; sceneName: string; sceneItemId: number; }
interface GetStatsAction extends ObsActionBase { type: "getStats"; }
interface GetVersionAction extends ObsActionBase { type: "getVersion"; }
interface GetHotkeyListAction extends ObsActionBase { type: "getHotkeyList"; }
interface GetInputPropertiesListPropertyItemsAction extends ObsActionBase { type: "getInputPropertiesListPropertyItems"; inputName: string; propertyName: string; }
interface PressInputPropertiesButtonAction extends ObsActionBase { type: "pressInputPropertiesButton"; inputName: string; propertyName: string; }
interface GetInputAudioBalanceAction extends ObsActionBase { type: "getInputAudioBalance"; inputName: string; }
interface SetInputAudioBalanceAction extends ObsActionBase { type: "setInputAudioBalance"; inputName: string; inputAudioBalance: number; }
interface GetInputAudioSyncOffsetAction extends ObsActionBase { type: "getInputAudioSyncOffset"; inputName: string; }
interface SetInputAudioSyncOffsetAction extends ObsActionBase { type: "setInputAudioSyncOffset"; inputName: string; inputAudioSyncOffset: number; }
interface GetInputAudioTracksAction extends ObsActionBase { type: "getInputAudioTracks"; inputName: string; }
interface SetInputAudioTracksAction extends ObsActionBase { type: "setInputAudioTracks"; inputName: string; inputAudioTracks: Record<string, boolean>; }
interface DuplicateSceneAction extends ObsActionBase { type: "duplicateScene"; sceneName: string; duplicateSceneName?: string; }
interface GetSourceScreenshotAction extends ObsActionBase { type: "getSourceScreenshot"; sourceName: string; imageFormat: string; imageWidth?: number; imageHeight?: number; imageCompressionQuality?: number; }
interface SetCurrentSceneTransitionSettingsAction extends ObsActionBase { type: "setCurrentSceneTransitionSettings"; transitionSettings: object; overlay?: boolean; }
interface OpenInputPropertiesDialogAction extends ObsActionBase { type: "openInputPropertiesDialog"; inputName: string; }
interface OpenInputFiltersDialogAction extends ObsActionBase { type: "openInputFiltersDialog"; inputName: string; }
interface OpenInputInteractDialogAction extends ObsActionBase { type: "openInputInteractDialog"; inputName: string; }


type ObsAction =
  | CreateInputAction | SetInputSettingsAction | SetSceneItemEnabledAction | GetInputSettingsAction | GetSceneItemListAction
  | SetCurrentProgramSceneAction | SetVideoSettingsAction | CreateSceneAction | RemoveInputAction | SetSceneItemTransformAction
  | CreateSourceFilterAction | SetInputVolumeAction | SetInputMuteAction | StartVirtualCamAction | StopVirtualCamAction
  | SaveScreenshotAction | StartReplayBufferAction | SaveReplayBufferAction | SetSourceFilterIndexAction | SetSourceFilterNameAction
  | DuplicateSourceFilterAction | TriggerStudioModeTransitionAction | SetInputAudioMonitorTypeAction | SetSceneItemBlendModeAction
  | RefreshBrowserSourceAction | GetLogFileListAction | GetLogFileAction | ToggleStudioModeAction | SetStudioModeEnabledAction | TriggerHotkeyByNameAction
  | TriggerHotkeyByKeySequenceAction | GetSourceFilterListAction | GetSourceFilterDefaultSettingsAction | GetSourceFilterSettingsAction
  | SetSourceFilterSettingsAction | SetSourceFilterEnabledAction | RemoveSourceFilterAction | ToggleStreamAction | ToggleRecordAction
  | GetInputDefaultSettingsAction | GetOutputListAction | GetOutputStatusAction | StartOutputAction | StopOutputAction
  | GetOutputSettingsAction | SetOutputSettingsAction | GetSceneTransitionListAction | GetCurrentSceneTransitionAction
  | SetCurrentSceneTransitionAction | SetSceneTransitionDurationAction | GetSceneTransitionCursorAction | GetMediaInputStatusAction
  | SetMediaInputCursorAction | OffsetMediaInputCursorAction | TriggerMediaInputActionAction | GetCurrentPreviewSceneAction
  | SetCurrentPreviewSceneAction | GetSceneItemLockedAction | SetSceneItemLockedAction | GetSceneItemIndexAction
  | SetSceneItemIndexAction | CreateSceneItemAction | RemoveSceneItemAction | GetStatsAction | GetVersionAction
  | GetHotkeyListAction | GetInputPropertiesListPropertyItemsAction | PressInputPropertiesButtonAction | GetInputAudioBalanceAction
  | SetInputAudioBalanceAction | GetInputAudioSyncOffsetAction | SetInputAudioSyncOffsetAction | GetInputAudioTracksAction
  | SetInputAudioTracksAction | DuplicateSceneAction | GetSourceScreenshotAction | SetCurrentSceneTransitionSettingsAction
  | OpenInputPropertiesDialogAction | OpenInputFiltersDialogAction | OpenInputInteractDialogAction | SetSceneNameAction;

function highlightJsonSyntax(rawJsonString: string): string {
  let htmlEscapedJsonString = rawJsonString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  htmlEscapedJsonString = htmlEscapedJsonString
    .replace(/"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?/g, (match, _fullString, _stringContent, _escape, colon) => {
      const className = colon ? 'text-[var(--ctp-blue)]' : 'text-[var(--ctp-green)]';
      return `<span class="${className}">${match.substring(0, match.length - (colon ? 1 : 0))}</span>${colon ? ':' : ''}`;
    })
    .replace(/\b(true|false|null)\b/g, '<span class="text-[var(--ctp-mauve)]">$1</span>')
    .replace(/(?<!\w)([-+]?\d*\.?\d+([eE][-+]?\d+)?)(?!\w)/g, '<span class="text-[var(--ctp-peach)]">$1</span>');

  return htmlEscapedJsonString;
}

function applyInlineMarkdown(text: string): string {
  let html = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  html = html.replace(/` + "`" + `([^` + "`" + `]+)` + "`" + `/g, '<code class="bg-[var(--ctp-surface0)] px-1 py-0.5 rounded text-xs text-[var(--ctp-peach)] shadow-inner">$1</code>');
  // Make **...** use the basic text color for system messages (used for OBS Action)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--ctp-base)] font-bold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="text-[var(--ctp-mauve)]">$1</em>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--ctp-sky)] hover:text-[var(--ctp-sapphire)] underline transition-colors">$1</a>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

const MarkdownRenderer: React.FC<{ content: string }> = React.memo(({ content }) => {
  const parts = [];
  let lastIndex = 0;
  const codeBlockRegex = /```(\w*)\s*\n?([\s\S]*?)\n?\s*```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(applyInlineMarkdown(content.substring(lastIndex, match.index)));
    }
    const lang = match[1]?.toLowerCase();
    const rawCode = match[2];
    let highlightedCode;
    if (lang === 'json') {
      highlightedCode = highlightJsonSyntax(rawCode);
    } else {
      highlightedCode = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    parts.push(
      `<pre class="bg-[var(--ctp-crust)] p-2.5 text-xs my-1.5 overflow-x-auto text-[var(--ctp-subtext1)] border border-[var(--ctp-surface1)] shadow-inner rounded-md leading-relaxed"><code class="language-${lang || ''}">${highlightedCode}</code></pre>`
    );
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(applyInlineMarkdown(content.substring(lastIndex)));
  }

  return <div dangerouslySetInnerHTML={{ __html: parts.join('') }} />;
});


interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  emoji?: string;
}

const allChatSuggestions: Suggestion[] = [
  { id: "sg1", label: "Scene Sources?", prompt: "What are the sources in the current scene?", emoji: "🖼️" },
  { id: "sg2", label: "Switch Scene", prompt: "Switch to another scene.", emoji: "🎬" },
  { id: "sg3", label: "Create Text", prompt: "Create a text source in the current scene.", emoji: "✍️" },
  { id: "sg4", label: "Apex Stream Ideas", prompt: "Suggest 3 stream ideas for playing Apex Legends.", emoji: "💡" },
  { id: "sg5", label: "Hide Source", prompt: "Hide a source in the current scene.", emoji: "🙈" },
  { id: "sg6", label: "Show Source", prompt: "Show a source in the current scene.", emoji: "👁️" },
  { id: "sg7", label: "Stream/Record Status?", prompt: "What is the current status of my stream and recording?", emoji: "📡" },
  { id: "sg8", label: "Set Text", prompt: "Set the text of a source in the current scene.", emoji: "💬" },
  { id: "sg9", label: "Add Filter", prompt: "Add a color correction filter to a source.", emoji: "🎨" },
  { id: "sg10", label: "30s Ad Script", prompt: "Can you give me a script for a 30-second ad read for a new energy drink?", emoji: "📜" },
  { id: "sg11", label: "Royalty-Free Music?", prompt: "What are some good websites for royalty-free music for streaming?", emoji: "🎵" },
  { id: "sg12", label: "Fix Audio Crackle", prompt: "I'm hearing audio crackling in OBS, what are common fixes?", emoji: "🛠️" },
  { id: "sg13", label: "Canvas to 1080p?", prompt: "How do I change my OBS canvas resolution to 1920x1080?", emoji: "🎞️" },
  { id: "sg14", label: "Duplicate Scene", prompt: "Duplicate the current scene.", emoji: "➕" },
  { id: "sg15", label: "Screenshot Source", prompt: "Get a PNG screenshot of a source in the current scene.", emoji: "📸" },
  { id: "sg16", label: "Transition Duration", prompt: "Set the current scene transition duration.", emoji: "⏱️" },
  { id: "sg17", label: "Open Filters", prompt: "Open the filters dialog for a source.", emoji: "⚙️" },
  { id: "sg18", label: "What's new in OBS?", prompt: "Using Google Search, tell me about the latest OBS Studio features.", emoji: "🔍" },
  { id: "sg19", label: "List video settings", prompt: "What are my current video settings in OBS?", emoji: "⚙️" },
  { id: "sg20", label: "Toggle Studio Mode", prompt: "Toggle OBS Studio Mode.", emoji: "🎭" },
];

const getRandomSuggestions = (count: number): Suggestion[] => {
  const shuffled = [...allChatSuggestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const ChatMessageItem: React.FC<{
  message: ChatMessage;
  onSuggestionClick?: (prompt: string) => void;
  accentColorName?: CatppuccinAccentColorName;
  obsSources?: OBSSource[];
  onSourceSelect?: (sourceName: string) => void;
  flipSides: boolean;
}> = ({ message, onSuggestionClick, accentColorName, obsSources, onSourceSelect, flipSides }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isShrunk, setIsShrunk] = useState(false);
  const [forceExpand, setForceExpand] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (itemRef.current) {
      gsap.fromTo(
        itemRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
      // Shrink logic: if height > 320px, shrink (unless forceExpand)
      if (!forceExpand && itemRef.current.scrollHeight > 320) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    }
  }, [message.text, forceExpand]);

  // Show suggestions if this is the Gemini welcome message
  const isGeminiWelcome = message.role === 'system' && /Gemini Assistant connected/i.test(message.text);

  function handleBubbleScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.target as HTMLDivElement;
    setIsScrolling(true);
    setIsScrolledFromTop(target.scrollTop > 10);

    // Check if scrolled to bottom (within 5px tolerance)
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 5;
    setIsScrolledToBottom(isAtBottom);

    clearTimeout((handleBubbleScroll as any)._scrollTimeout);
    (handleBubbleScroll as any)._scrollTimeout = setTimeout(() => setIsScrolling(false), 1000);
  }

  return (
    <div
      ref={itemRef}
      className={`flex ${(message.role === 'user' && !flipSides) || (message.role === 'model' && flipSides)
        ? 'justify-end'
        : (message.role === 'model' && !flipSides) || (message.role === 'user' && flipSides)
          ? 'justify-start'
          : 'justify-center'
        }`}
    >
      <div
        className={`chat-message max-w-xl rounded-2xl shadow-xl border border-[var(--ctp-surface2)] bg-[var(--ctp-surface0)] relative
          ${message.role === 'system'
            ? 'px-4 py-2 text-xs font-extrabold leading-tight'
            : 'p-4 leading-relaxed'}
        `}
        style={{
          backgroundColor: message.role === 'user' ? 'var(--user-chat-bubble-color)' :
            message.role === 'model' ? 'var(--model-chat-bubble-color)' :
              'var(--dynamic-secondary-accent)',
          color: 'var(--ctp-base)',
          fontStyle: message.role === 'system' ? 'italic' : 'normal',
          fontSize: message.role === 'system' ? '0.85rem' : '1rem',
          position: 'relative',
          ['--bubble-scrollbar-thumb' as any]: message.role === 'user'
            ? 'var(--user-chat-bubble-color)'
            : message.role === 'model'
              ? 'var(--model-chat-bubble-color)'
              : 'var(--dynamic-secondary-accent)',
          ['--bubble-scrollbar-thumb-hover' as any]: message.role === 'user'
            ? 'var(--ctp-blue)'
            : message.role === 'model'
              ? 'var(--ctp-lavender)'
              : 'var(--dynamic-secondary-accent)',
          ['--bubble-fade-color' as any]: message.role === 'user'
            ? 'var(--user-chat-bubble-color)'
            : message.role === 'model'
              ? 'var(--model-chat-bubble-color)'
              : 'var(--dynamic-secondary-accent)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            ref={bubbleRef}
            className={`chat-scrollable-content
              ${isShrunk ? 'max-h-80 overflow-y-auto custom-scrollbar shrunk' : ''}
              ${isScrolling ? 'scrolling' : ''}
            `}
            onScroll={isShrunk ? handleBubbleScroll : undefined}
          >
            <MarkdownRenderer content={message.text} />
            {message.type === "source-prompt" && obsSources && onSourceSelect && (
              <div className="mt-2">
                <div className="text-xs mb-1 text-[var(--ctp-base)] text-opacity-70">Select a source:</div>
                <div className="flex flex-wrap gap-1">
                  {obsSources.map((src) => (
                    <Button
                      key={src.sourceName}
                      onClick={() => onSourceSelect(src.sourceName)}
                      variant="secondary"
                      size="sm"
                      accentColorName={accentColorName}
                      className="bg-[var(--dynamic-secondary-accent)] hover:bg-[var(--dynamic-accent)] text-[var(--ctp-crust)] border border-[var(--ctp-surface0)] shadow-[0_2px_8px_0_rgba(0,0,0,0.10)] text-xs transition-colors ring-1 ring-[var(--ctp-overlay1)] ring-inset"
                      title={src.sourceName}
                    >
                      {src.sourceName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {isGeminiWelcome && onSuggestionClick && (
              <div className="mt-2 pt-2 border-t border-[var(--ctp-surface1)]">
                <div
                  className="text-xs mt-1.5 text-[var(--ctp-base)] text-opacity-70 mb-1"
                >
                  Quick suggestions:
                </div>
                <div className="flex flex-wrap gap-1">
                  {getRandomSuggestions(3).map((suggestion) => (
                    <Button
                      key={suggestion.id}
                      onClick={() => onSuggestionClick(suggestion.prompt)}
                      variant="secondary"
                      size="sm"
                      accentColorName={accentColorName}
                      className="bg-[var(--dynamic-secondary-accent)] hover:bg-[var(--dynamic-accent)] text-[var(--ctp-crust)] border border-[var(--ctp-surface0)] shadow-[0_2px_8px_0_rgba(0,0,0,0.10)] text-xs transition-colors ring-1 ring-[var(--ctp-overlay1)] ring-inset"
                      title={suggestion.prompt}
                    >
                      {suggestion.emoji && <span className="emoji mr-1" role="img" aria-hidden="true">{suggestion.emoji}</span>}
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {message.role === 'model' && message.sources && message.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--ctp-surface1)] opacity-90">
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--ctp-base)', opacity: 0.8 }}>Sources:</p>
                <ul className="list-disc list-inside space-y-1">
                  {message.sources.map((source, index) => source.web && (
                    <li key={index} className="text-xs">
                      <a href={source.web.uri} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ctp-base)' }} className="underline hover:opacity-80">
                        {source.web.title || source.web.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Top fade overlay when scrolled from top */}
          {isShrunk && isScrolledFromTop && (
            <div className="bubble-fade-top" />
          )}
          {/* Absolutely positioned fade overlay, only when shrunk and not at bottom */}
          {isShrunk && !isScrolledToBottom && (
            <div className={`bubble-fade-bottom ${isScrolling ? 'opacity-30' : 'opacity-100'}`} />
          )}
        </div>
        {/* Timestamp outside of scrollable area */}
        <div className="text-xs mt-1.5 text-[var(--ctp-base)] text-opacity-70 relative z-20">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {/* Expand/collapse floating icon button (bottom right, more visible) */}
        {isShrunk && !forceExpand && (
          <button
            className="absolute right-3 bottom-3 z-40 bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--dynamic-accent)] hover:text-[var(--ctp-mauve)] p-2.5 rounded-full shadow-2xl border-2 border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--ctp-mauve)]"
            style={{ fontSize: '1.7rem', lineHeight: 1, boxShadow: '0 6px 24px 0 rgba(0,0,0,0.22)' }}
            onClick={() => setForceExpand(true)}
            title="Expand bubble"
            aria-label="Expand chat bubble"
          >
            <ChevronDownIcon className="w-7 h-7" />
          </button>
        )}
        {forceExpand && (
          <button
            className="absolute right-3 bottom-3 z-40 bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--ctp-overlay1)] hover:text-[var(--ctp-mauve)] p-2.5 rounded-full shadow-2xl border-2 border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--ctp-mauve)]"
            style={{ fontSize: '1.7rem', lineHeight: 1, boxShadow: '0 6px 24px 0 rgba(0,0,0,0.22)' }}
            onClick={() => setForceExpand(false)}
            title="Shrink bubble"
            aria-label="Shrink chat bubble"
          >
            <ChevronUpIcon className="w-7 h-7" />
          </button>
        )}
      </div>
    </div>
  );
};


export const GeminiChat: React.FC<GeminiChatProps> = ({
  geminiApiKeyFromInput,
  obsService,
  obsData,
  onRefreshData,
  setErrorMessage,
  chatInputValue,
  onChatInputChange,
  accentColorName,
  messages,
  onAddMessage,
  isGeminiClientInitialized,
  geminiInitializationError,
  onSetIsGeminiClientInitialized,
  onSetGeminiInitializationError,
  // activeTab,
  streamerName, // <-- Destructure new prop
  flipSides,
  // setFlipSides
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  // const [displayedSuggestions, setDisplayedSuggestions] = useState<Suggestion[]>([]);
  // const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ai = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    const effectiveApiKey = geminiApiKeyFromInput || process.env.API_KEY;
    if (effectiveApiKey) {
      try {
        if (!ai.current || !isGeminiClientInitialized) {
          ai.current = new GoogleGenAI({ apiKey: effectiveApiKey });
          onSetIsGeminiClientInitialized(true);
          onSetGeminiInitializationError(null);
        }
        // Only add a system message if there is NOT already a Gemini greeting system message
        // Prevents double-greetings on mount/race conditions
        const hasGeminiGreeting = messages.some(
          (msg) =>
            msg.role === 'system' &&
            /Gemini Assistant connected/i.test(msg.text)
        );
        if (
          !hasGeminiGreeting &&
          isGeminiClientInitialized &&
          !geminiInitializationError
        ) {
          let username = streamerName;
          const streamer = username ? `, **${username}**` : '';
          onAddMessage({ role: 'system', text: `Gemini Assistant connected${streamer}! Ready for your commands! GLHF! ✨` });
        }
      } catch (e: any) {
        const errorMsg = `Failed to initialize Gemini client: ${(e as Error).message}. Ensure API Key is valid.`;
        onSetGeminiInitializationError(errorMsg);
        onSetIsGeminiClientInitialized(false);
        ai.current = null;
        onAddMessage({ role: 'system', text: errorMsg });
      }
    } else {
      const errorMsg = "Gemini API Key must be configured. Gemini features are unavailable.";
      onSetGeminiInitializationError(errorMsg);
      onSetIsGeminiClientInitialized(false);
      ai.current = null;
      onAddMessage({ role: 'system', text: errorMsg });
    }
  }, [geminiApiKeyFromInput, onSetIsGeminiClientInitialized, onSetGeminiInitializationError, isGeminiClientInitialized, geminiInitializationError, streamerName, onAddMessage, messages.length]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // useEffect(() => {
  //   if (activeTab === AppTab.GEMINI || messages.length > 0) {
  //     setDisplayedSuggestions(getRandomSuggestions(3));
  //     setShowSuggestions(true);
  //   }
  // }, [activeTab, messages.length]);


  const fetchObsContextString = useCallback(() => {
    let context = "Current OBS Status:\n";
    if (obsData.currentProgramScene) context += `- Active Scene: ${obsData.currentProgramScene}\n`;
    else context += "- No active scene currently selected.\n";

    if (obsData.scenes.length > 0) context += `- Available Scenes: ${obsData.scenes.map(s => s.sceneName).join(', ')}\n`;
    else context += "- No scenes found in OBS.\n";

    if (obsData.currentProgramScene && obsData.sources.length > 0) {
      context += `- Sources in active scene '${obsData.currentProgramScene}': ${obsData.sources.map(s => s.sourceName + (s.sceneItemEnabled ? " (visible)" : " (hidden)")).join(', ')}\n`;
    } else if (obsData.currentProgramScene) {
      context += `- No sources found in the active scene '${obsData.currentProgramScene}'.\n`;
    }

    if (obsData.streamStatus) context += `- Streaming: ${obsData.streamStatus.outputActive ? 'Yes' : 'No'}\n`;
    if (obsData.videoSettings) context += `- Output Resolution: ${obsData.videoSettings.outputWidth}x${obsData.videoSettings.outputHeight} @ ${obsData.videoSettings.fpsNumerator / (obsData.videoSettings.fpsDenominator || 1)} FPS\n`;
    return context;
  }, [obsData]);

  const handleSend = async () => {
    if (!chatInputValue.trim() || !isGeminiClientInitialized || !ai.current) {
      if (!ai.current && !geminiInitializationError) {
        onSetGeminiInitializationError("Gemini client not ready. Please ensure API key is set and valid.");
      }
      return;
    }

    const userMessageText = chatInputValue;
    onAddMessage({ role: 'user', text: userMessageText });
    onChatInputChange('');
    setIsLoading(true);
    setErrorMessage(null);

    const obsContext = fetchObsContextString();
    const historyForApi: Content[] = messages
      .slice(-10)
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.text }]
      }));

    const contentsForApi: Content[] = [
      ...historyForApi,
      { role: 'user', parts: [{ text: `${obsContext}\n\nUser query: ${userMessageText}` }] }
    ];

    try {
      const modelService = ai.current.models;
      const generationConfig: any = {};

      if (useGoogleSearch) {
        generationConfig.tools = [{ googleSearch: {} }];
      } else {
        generationConfig.responseMimeType = "application/json";
        generationConfig.systemInstruction = { role: "system", parts: [{ text: INITIAL_SYSTEM_PROMPT }] };
      }

      const result: GenerateContentResponse = await modelService.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: contentsForApi,
        config: generationConfig,
      });

      let parsedResponse: GeminiActionResponse | null = null;
      let modelResponseText = "Could not understand the response from Gemini.";
      let responseSources: GroundingChunk[] | undefined = undefined;

      if (useGoogleSearch && result.candidates && result.candidates[0]?.groundingMetadata?.groundingChunks) {
        const apiChunks = result.candidates[0].groundingMetadata.groundingChunks;
        responseSources = apiChunks
          .filter(chunk => chunk.web && typeof chunk.web.uri === 'string' && typeof chunk.web.title === 'string')
          .map(chunk => ({ web: { uri: chunk.web!.uri!, title: chunk.web!.title! } }));
      }

      if (useGoogleSearch) {
        modelResponseText = result.text || "Gemini responded but without text.";
        parsedResponse = { responseText: modelResponseText, sources: responseSources };
      } else {
        try {
          let rawJsonText = (result.text || "").trim();
          const fenceRegex = /^```(\w*)?\s*\n?([\s\S]*?)\n?\s*```$/s;
          const match = fenceRegex.exec(rawJsonText);
          if (match && match[2]) {
            rawJsonText = match[2].trim();
          }
          parsedResponse = JSON.parse(rawJsonText) as GeminiActionResponse;
          modelResponseText = parsedResponse?.responseText || "Gemini responded but without text.";
        } catch (parseError: any) {
          console.warn("Failed to parse Gemini JSON response, treating as plain text:", parseError, "Raw text:", result.text);
          modelResponseText = result.text || "Gemini responded in an unexpected format.";
          parsedResponse = { responseText: modelResponseText };
        }
      }

      onAddMessage({ role: 'model', text: modelResponseText, sources: responseSources });

      if (parsedResponse && parsedResponse.obsAction && !useGoogleSearch) {
        await handleObsAction(parsedResponse.obsAction);
      }

    } catch (e: any) {
      console.error("Gemini API error:", e);
      const errorMessageText = (e as Error).message || "Failed to get response from Gemini.";
      setErrorMessage(errorMessageText);
      onAddMessage({ role: 'system', text: `❗ Gemini API Error: ${errorMessageText}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleObsAction = async (action: ObsAction) => {
    let actionAttemptMessage = `**OBS Action: \`${action.type}\`**\n\n⚙️ Attempting: ${action.type}...`;
    let actionFeedback = "";
    let additionalSystemMessage = "";

    try {
      switch (action.type) {
        case 'createInput':
          const createAction = action as CreateInputAction;
          let sceneToAddTo = createAction.sceneName;
          if (sceneToAddTo && !obsData.scenes.find(s => s.sceneName === sceneToAddTo)) {
            actionFeedback += `\n⚠️ Scene "${sceneToAddTo}" not found. Trying current scene or creating globally.`;
            sceneToAddTo = obsData.currentProgramScene || undefined;
          }
          await obsService.createInput(
            createAction.inputName,
            createAction.inputKind,
            createAction.inputSettings,
            sceneToAddTo,
            createAction.sceneItemEnabled
          );
          actionFeedback += `\n✅ Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`;
          break;
        case 'setInputSettings':
          const setSettingsAction = action as SetInputSettingsAction;
          await obsService.setInputSettings(
            setSettingsAction.inputName,
            setSettingsAction.inputSettings,
            setSettingsAction.overlay
          );
          actionFeedback = `\n✅ Successfully updated settings for input "${setSettingsAction.inputName}".`;
          break;
        case 'setSceneItemEnabled':
          const targetAction = action as SetSceneItemEnabledAction;
          const sceneItemId = await obsService.getSceneItemId(targetAction.sceneName, targetAction.sourceName);
          if (sceneItemId === null) {
            throw new Error(`Source "${targetAction.sourceName}" not found in scene "${targetAction.sceneName}".`);
          }
          const enabledValue = typeof targetAction.sceneItemEnabled === 'boolean'
            ? targetAction.sceneItemEnabled
            : !!targetAction.enabled;
          await obsService.setSceneItemEnabled(targetAction.sceneName, sceneItemId, enabledValue);
          actionFeedback = `\n✅ Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`;
          break;
        case 'getInputSettings':
          const getSettingsAction = action as GetInputSettingsAction;
          const settingsResponse = await obsService.getInputSettings(getSettingsAction.inputName);
          actionFeedback = `\n✅ Fetched settings for input "${getSettingsAction.inputName}".`;
          additionalSystemMessage = `ℹ️ Properties for input "${getSettingsAction.inputName}" (Kind: "${settingsResponse.inputKind}"):\n\`\`\`json\n${JSON.stringify(settingsResponse.inputSettings, null, 2)}\n\`\`\``;
          break;
        case 'getSceneItemList':
          const getListAction = action as GetSceneItemListAction;
          const listResponse = await obsService.getSceneItemList(getListAction.sceneName);
          const itemsFormatted = listResponse.sceneItems.map(item => ({
            name: item.sourceName,
            id: item.sceneItemId,
            enabled: item.sceneItemEnabled,
            kind: item.inputKind || 'N/A'
          }));
          actionFeedback = `\n✅ Fetched items for scene "${getListAction.sceneName}".`;
          additionalSystemMessage = `ℹ️ Items in scene "${getListAction.sceneName}":\n\`\`\`json\n${JSON.stringify(itemsFormatted, null, 2)}\n\`\`\``;
          break;
        case 'setCurrentProgramScene':
          const setSceneAction = action as SetCurrentProgramSceneAction;
          await obsService.setCurrentProgramScene(setSceneAction.sceneName);
          actionFeedback = `\n✅ Successfully switched to scene "${setSceneAction.sceneName}".`;
          break;
        case 'setVideoSettings':
          const setVideoAction = action as SetVideoSettingsAction;
          await obsService.setVideoSettings(setVideoAction.videoSettings);
          actionFeedback = `\n✅ Successfully updated video settings.`;
          break;
        case 'createScene':
          const createSceneAction = action as CreateSceneAction;
          await obsService.createScene(createSceneAction.sceneName);
          actionFeedback = `\n✅ Successfully created scene "${createSceneAction.sceneName}".`;
          break;
        case 'removeInput':
          const removeInputAction = action as RemoveInputAction;
          await obsService.removeInput(removeInputAction.inputName);
          actionFeedback = `\n✅ Successfully removed input "${removeInputAction.inputName}".`;
          break;
        case 'setSceneItemTransform':
          const transformAction = action as SetSceneItemTransformAction;
          const sceneItemIdTransform = await obsService.getSceneItemId(
            transformAction.sceneName,
            transformAction.sourceName
          );
          if (sceneItemIdTransform === null) {
            throw new Error(`Source "${transformAction.sourceName}" not found in scene "${transformAction.sceneName}".`);
          }
          await obsService.setSceneItemTransform(
            transformAction.sceneName,
            sceneItemIdTransform,
            transformAction.transform
          );
          actionFeedback = `\n✅ Successfully updated transform for "${transformAction.sourceName}" in scene "${transformAction.sceneName}".`;
          break;
        case 'createSourceFilter':
          const filterAction = action as CreateSourceFilterAction;
          await obsService.createSourceFilter(
            filterAction.sourceName,
            filterAction.filterName,
            filterAction.filterKind,
            filterAction.filterSettings
          );
          actionFeedback = `\n✅ Successfully created filter "${filterAction.filterName}" on source "${filterAction.sourceName}".`;
          break;
        case 'setInputVolume':
          const volumeAction = action as SetInputVolumeAction;
          await obsService.setInputVolume(volumeAction.inputName, volumeAction.inputVolumeMul, volumeAction.inputVolumeDb);
          actionFeedback = `\n✅ Successfully set volume for input "${volumeAction.inputName}".`;
          break;
        case 'setInputMute':
          const muteAction = action as SetInputMuteAction;
          await obsService.setInputMute(muteAction.inputName, muteAction.inputMuted);
          actionFeedback = `\n✅ Successfully ${muteAction.inputMuted ? 'muted' : 'unmuted'} input "${muteAction.inputName}".`;
          break;
        case 'startVirtualCam': await obsService.startVirtualCam(); actionFeedback = `\n✅ Successfully started virtual camera.`; break;
        case 'stopVirtualCam': await obsService.stopVirtualCam(); actionFeedback = `\n✅ Successfully stopped virtual camera.`; break;
        case 'saveScreenshot': actionFeedback = `\n❌ Screenshot functionality is not available: saveScreenshot is not implemented in OBSWebSocketService.`; break;
        case 'startReplayBuffer': await obsService.startReplayBuffer(); actionFeedback = `\n✅ Successfully started replay buffer.`; break;
        case 'saveReplayBuffer': await obsService.saveReplayBuffer(); actionFeedback = `\n✅ Successfully saved replay buffer.`; break;
        case 'triggerStudioModeTransition': await obsService.triggerStudioModeTransition(); actionFeedback = `\n✅ Successfully triggered studio mode transition.`; break;
        case 'setInputAudioMonitorType':
          const monitorAction = action as SetInputAudioMonitorTypeAction;
          await obsService.setInputAudioMonitorType(monitorAction.inputName, monitorAction.monitorType);
          actionFeedback = `\n✅ Audio monitoring for "${monitorAction.inputName}" set to "${monitorAction.monitorType}".`;
          break;
        case 'setSceneItemBlendMode':
          const blendAction = action as SetSceneItemBlendModeAction;
          const sceneItemIdBlend = await obsService.getSceneItemId(blendAction.sceneName, blendAction.sourceName);
          if (sceneItemIdBlend === null) throw new Error(`Source "${blendAction.sourceName}" not found in scene "${blendAction.sceneName}".`);
          await obsService.setSceneItemBlendMode(blendAction.sceneName, sceneItemIdBlend, blendAction.blendMode);
          actionFeedback = `\n✅ Blend mode for "${blendAction.sourceName}" set to "${blendAction.blendMode}".`;
          break;
        case 'refreshBrowserSource':
          await obsService.refreshBrowserSource((action as RefreshBrowserSourceAction).inputName);
          actionFeedback = `\n✅ Refreshed browser source "${(action as RefreshBrowserSourceAction).inputName}".`;
          break;
        case 'getLogFileList':
          try {
            const logList = await obsService.getLogFileList();
            actionFeedback = `\n✅ Retrieved OBS log file list.`;
            additionalSystemMessage = `\`\`\`json\n${JSON.stringify(logList, null, 2)}\n\`\`\``;
          } catch (error: any) {
            actionFeedback = `\n❌ ${error.message}`;
            additionalSystemMessage = `**How to access OBS logs:**\n\n1. In OBS Studio, go to **Help** → **Log Files** → **View Current Log**\n2. Or find log files in your system:\n   - **Windows**: \`%APPDATA%\\obs-studio\\logs\`\n   - **macOS**: \`~/Library/Application Support/obs-studio/logs\`\n   - **Linux**: \`~/.config/obs-studio/logs\``;
          }
          break;
        case 'getLogFile':
          try {
            const logFileAction = action as GetLogFileAction;
            const logFileContent = await obsService.getLogFile(logFileAction.logFile);
            actionFeedback = `\n✅ Retrieved OBS log file "${logFileAction.logFile}".`;
            additionalSystemMessage = `\`\`\`text\n${logFileContent.content || JSON.stringify(logFileContent, null, 2)}\n\`\`\``;
          } catch (error: any) {
            actionFeedback = `\n❌ ${error.message}`;
            additionalSystemMessage = `**How to access OBS logs:**\n\n1. In OBS Studio, go to **Help** → **Log Files** → **View Current Log**\n2. Or find log files in your system:\n   - **Windows**: \`%APPDATA%\\obs-studio\\logs\`\n   - **macOS**: \`~/Library/Application Support/obs-studio/logs\`\n   - **Linux**: \`~/.config/obs-studio/logs\``;
          }
          break;
        case "toggleStream": await obsService.toggleStream(); actionFeedback = "\n✅ Stream toggled!"; break;
        case "toggleRecord": await obsService.toggleRecord(); actionFeedback = "\n✅ Record toggled!"; break;
        case "toggleStudioMode": await obsService.toggleStudioMode(); actionFeedback = "\n✅ Studio mode toggled!"; break;
        case "setStudioModeEnabled":
          await obsService.setStudioModeEnabled((action as SetStudioModeEnabledAction).enabled);
          actionFeedback = `\n✅ Studio mode ${(action as SetStudioModeEnabledAction).enabled ? "enabled" : "disabled"}!`;
          break;
        case "triggerHotkeyByName":
          await obsService.triggerHotkeyByName((action as TriggerHotkeyByNameAction).hotkeyName);
          actionFeedback = `\n✅ Hotkey "${(action as TriggerHotkeyByNameAction).hotkeyName}" triggered!`;
          break;
        case "triggerHotkeyByKeySequence":
          const hotkeyAction = action as TriggerHotkeyByKeySequenceAction;
          await obsService.triggerHotkeyByKeySequence(hotkeyAction.keyId, hotkeyAction.keyModifiers);
          actionFeedback = `\n✅ Hotkey sequence triggered!`;
          break;
        case "getSourceFilterList":
          const filterList = await obsService.getSourceFilterList((action as GetSourceFilterListAction).sourceName);
          actionFeedback = `\n✅ Got filter list for source "${(action as GetSourceFilterListAction).sourceName}".`;
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(filterList, null, 2)}\n\`\`\``;
          break;
        case "getSourceFilterDefaultSettings":
          const defaultFilterSettings = await obsService.getSourceFilterDefaultSettings((action as GetSourceFilterDefaultSettingsAction).filterKind);
          actionFeedback = `\n✅ Got default settings for filter kind "${(action as GetSourceFilterDefaultSettingsAction).filterKind}".`;
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(defaultFilterSettings, null, 2)}\n\`\`\``;
          break;
        case "getSourceFilterSettings":
          const getFilterSettings = action as GetSourceFilterSettingsAction;
          const filterSettings = await obsService.getSourceFilterSettings(getFilterSettings.sourceName, getFilterSettings.filterName);
          actionFeedback = `\n✅ Got settings for filter "${getFilterSettings.filterName}" on source "${getFilterSettings.sourceName}".`;
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(filterSettings, null, 2)}\n\`\`\``;
          break;
        case "setSourceFilterSettings":
          const setFilterSettings = action as SetSourceFilterSettingsAction;
          await obsService.setSourceFilterSettings(setFilterSettings.sourceName, setFilterSettings.filterName, setFilterSettings.filterSettings, setFilterSettings.overlay);
          actionFeedback = "\n✅ Filter settings updated.";
          break;
        case "setSourceFilterEnabled":
          const setFilterEnabled = action as SetSourceFilterEnabledAction;
          await obsService.setSourceFilterEnabled(setFilterEnabled.sourceName, setFilterEnabled.filterName, setFilterEnabled.filterEnabled);
          actionFeedback = `\n✅ Filter "${setFilterEnabled.filterName}" ${setFilterEnabled.filterEnabled ? "enabled" : "disabled"}.`;
          break;
        case "removeSourceFilter":
          const removeFilter = action as RemoveSourceFilterAction;
          await obsService.removeSourceFilter(removeFilter.sourceName, removeFilter.filterName);
          actionFeedback = `\n✅ Filter "${removeFilter.filterName}" removed.`;
          break;
        case "setSourceFilterIndex":
          const setFilterIndex = action as SetSourceFilterIndexAction;
          await obsService.setSourceFilterIndex(setFilterIndex.sourceName, setFilterIndex.filterName, setFilterIndex.filterIndex);
          actionFeedback = `\n✅ Filter "${setFilterIndex.filterName}" moved to index ${setFilterIndex.filterIndex}.`;
          break;
        case "setSourceFilterName":
          const setFilterName = action as SetSourceFilterNameAction;
          await obsService.setSourceFilterName(setFilterName.sourceName, setFilterName.filterName, setFilterName.newFilterName);
          actionFeedback = `\n✅ Filter renamed to "${setFilterName.newFilterName}".`;
          break;
        case "duplicateSourceFilter":
          const dupFilter = action as DuplicateSourceFilterAction;
          await obsService.duplicateSourceFilter(dupFilter.sourceName, dupFilter.filterName, dupFilter.newFilterName);
          actionFeedback = `\n✅ Filter duplicated as "${dupFilter.newFilterName}".`;
          break;
        case "getInputDefaultSettings":
          const defaultSettings = await obsService.getInputDefaultSettings((action as GetInputDefaultSettingsAction).inputKind);
          actionFeedback = `\n✅ Got default input settings for kind "${(action as GetInputDefaultSettingsAction).inputKind}".`;
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(defaultSettings, null, 2)}\n\`\`\``;
          break;
        case "getOutputList":
          const outputList = await obsService.getOutputList();
          actionFeedback = "\n✅ Retrieved output list.";
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(outputList, null, 2)}\n\`\`\``;
          break;
        case "getOutputStatus":
          const outputStatusAction = action as GetOutputStatusAction;
          const outputStatus = await obsService.getOutputStatus(outputStatusAction.outputName);
          actionFeedback = `\n✅ Retrieved status for output "${outputStatusAction.outputName}".`;
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(outputStatus, null, 2)}\n\`\`\``;
          break;
        case "startOutput":
          await obsService.startOutput((action as StartOutputAction).outputName);
          actionFeedback = `\n✅ Started output "${(action as StartOutputAction).outputName}".`;
          break;
        case "stopOutput":
          await obsService.stopOutput((action as StopOutputAction).outputName);
          actionFeedback = `\n✅ Stopped output "${(action as StopOutputAction).outputName}".`;
          break;
        case "getOutputSettings":
          const getOutputSettingsAction = action as GetOutputSettingsAction;
          const outputSettings = await obsService.getOutputSettings(getOutputSettingsAction.outputName);
          actionFeedback = `\n✅ Retrieved settings for output "${getOutputSettingsAction.outputName}".`;
          additionalSystemMessage = `\`\`\`json\n${JSON.stringify(outputSettings, null, 2)}\n\`\`\``;
          break;
        case "setOutputSettings":
          const setOutputSettingsAction = action as SetOutputSettingsAction;
          await obsService.setOutputSettings(setOutputSettingsAction.outputName, setOutputSettingsAction.outputSettings);
          actionFeedback = `\n✅ Updated settings for output "${setOutputSettingsAction.outputName}".`;
          break;
        case 'duplicateScene':
          const dupSceneAction = action as DuplicateSceneAction;
          await obsService.duplicateScene(dupSceneAction.sceneName, dupSceneAction.duplicateSceneName);
          actionFeedback = `\n✅ Scene "${dupSceneAction.sceneName}" duplicated${dupSceneAction.duplicateSceneName ? ` as "${dupSceneAction.duplicateSceneName}"` : ''}.`;
          break;
        case 'getSourceScreenshot':
          const screenshotAction = action as GetSourceScreenshotAction;
          const screenshotData = await obsService.getSourceScreenshot(
            screenshotAction.sourceName,
            screenshotAction.imageFormat,
            screenshotAction.imageWidth,
            screenshotAction.imageHeight,
            screenshotAction.imageCompressionQuality
          );
          actionFeedback = `\n✅ Screenshot for source "${screenshotAction.sourceName}" fetched.`;
          additionalSystemMessage = `ℹ️ Screenshot data for "${screenshotAction.sourceName}" (format: ${screenshotAction.imageFormat}) received by the application. Image data is ${screenshotData.imageData ? screenshotData.imageData.length : 0} characters long.`;
          break;
        case 'setCurrentSceneTransitionSettings':
          const transSettingsAction = action as SetCurrentSceneTransitionSettingsAction;
          await obsService.setCurrentSceneTransitionSettings(transSettingsAction.transitionSettings, transSettingsAction.overlay);
          actionFeedback = `\n✅ Current scene transition settings updated.`;
          break;
        case 'openInputPropertiesDialog':
          await obsService.openInputPropertiesDialog((action as OpenInputPropertiesDialogAction).inputName);
          actionFeedback = `\n✅ Properties dialog for input "${(action as OpenInputPropertiesDialogAction).inputName}" requested to open.`;
          break;
        case 'openInputFiltersDialog':
          await obsService.openInputFiltersDialog((action as OpenInputFiltersDialogAction).inputName);
          actionFeedback = `\n✅ Filters dialog for input "${(action as OpenInputFiltersDialogAction).inputName}" requested to open.`;
          break;
        case 'openInputInteractDialog':
          await obsService.openInputInteractDialog((action as OpenInputInteractDialogAction).inputName);
          actionFeedback = `\n✅ Interact dialog for input "${(action as OpenInputInteractDialogAction).inputName}" requested to open.`;
          break;
        case 'setSceneName':
          const setNameAction = action as SetSceneNameAction;
          await obsService.setSceneName(setNameAction.sceneName, setNameAction.newSceneName);
          actionFeedback = `\n✅ Successfully renamed scene "${setNameAction.sceneName}" to "${setNameAction.newSceneName}".`;
          break;
        default:
          const unknownActionType = (action as any).type;
          actionFeedback = `\n❌ Unsupported OBS action type: ${unknownActionType}`;
          throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
      }
      actionAttemptMessage += `${actionFeedback}`;
      if (additionalSystemMessage) {
        actionAttemptMessage += `\n\n---\n${additionalSystemMessage}`;
      }
      onAddMessage({ role: 'system', text: actionAttemptMessage });
      await onRefreshData();
    } catch (err: any) {
      console.error(`OBS Action "${action.type}" failed:`, err);
      const failureFeedback = `\n❗ Failed to execute OBS action "${action.type}": ${(err as Error).message || 'Unknown error'}`;
      actionAttemptMessage += `${failureFeedback}`;
      onAddMessage({ role: 'system', text: actionAttemptMessage });
      setErrorMessage(`OBS Action "${action.type}" failed: ${(err as Error).message}`);
    }
  };

  const genericSourcePrompts = [
    "Hide a source in the current scene.",
    "Show a source in the current scene.",
    "Set the text of a source in the current scene.",
    "Add a color correction filter to a source.",
    "Get a PNG screenshot of a source in the current scene.",
    "Open the filters dialog for a source."
  ];

  // const [pendingSourcePrompt, setPendingSourcePrompt] = useState<string | null>(null);

  const handleSuggestionClick = (prompt: string) => {
    if (genericSourcePrompts.includes(prompt)) {
      // Add a system message with type "source-prompt"
      onAddMessage({
        role: "system",
        text: "Select a source for this action:",
        type: "source-prompt",
        sourcePrompt: prompt,
      });
    } else {
      onChatInputChange(prompt);
      document.getElementById('gemini-input')?.focus();
    }
  };

  // This effect will run once when the streamerName is first fetched
  // Remove duplicate greeting effect

  return (
    <div className="flex flex-col h-full bg-[var(--ctp-surface0)] rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
      <div className="p-2 border-b border-[var(--ctp-surface1)] text-base font-semibold emoji-text" style={{ color: 'var(--dynamic-accent)' }}><span className="emoji">✨</span> Gemini Assistant</div>

      <div className="flex-grow p-2 space-y-2 overflow-y-auto">
        {messages.map((msg, idx) => (
          <ChatMessageItem
            key={msg.id || idx}
            message={msg}
            onSuggestionClick={handleSuggestionClick}
            accentColorName={accentColorName}
            obsSources={msg.type === "source-prompt" ? obsData.sources : undefined}
            onSourceSelect={
              msg.type === "source-prompt"
                ? (srcName) => {
                  let specificPrompt = "";
                  if (msg.sourcePrompt === "Hide a source in the current scene.") {
                    specificPrompt = `Hide the source named '${srcName}' in the current scene`;
                  } else if (msg.sourcePrompt === "Show a source in the current scene.") {
                    specificPrompt = `Show the source named '${srcName}' in the current scene`;
                  } else if (msg.sourcePrompt === "Set the text of a source in the current scene.") {
                    specificPrompt = `Set the text of source '${srcName}' to 'Your text here'`;
                  } else if (msg.sourcePrompt === "Add a color correction filter to a source.") {
                    specificPrompt = `Add a color correction filter named 'Vibrance' to source '${srcName}' with settings { saturation: 0.2 }`;
                  } else if (msg.sourcePrompt === "Get a PNG screenshot of a source in the current scene.") {
                    specificPrompt = `Get a PNG screenshot of the source '${srcName}' with width 640`;
                  } else if (msg.sourcePrompt === "Open the filters dialog for a source.") {
                    specificPrompt = `Open the filters dialog for the source '${srcName}'`;
                  }
                  onChatInputChange(specificPrompt);
                  // Optionally, remove the prompt message after selection
                  // messages.splice(idx, 1);
                  document.getElementById('gemini-input')?.focus();
                }
                : undefined
            }
            flipSides={flipSides}
          />
        ))}
        {isLoading && <div className="flex justify-center py-2"><LoadingSpinner size={5} /> <span className="ml-2 text-xs text-[var(--ctp-subtext0)]">Gemini is thinking...</span></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-[var(--ctp-surface1)] bg-[var(--ctp-mantle)]">
        <div className="flex items-center space-x-1.5">
          <TextInput
            id="gemini-input"
            type="text"
            value={chatInputValue}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && isGeminiClientInitialized && handleSend()}
            placeholder={!isGeminiClientInitialized ? (geminiInitializationError || "Gemini not ready...") : "Ask Gemini or command OBS..."}
            className="flex-grow text-xs"
            disabled={isLoading || !isGeminiClientInitialized}
            accentColorName={accentColorName}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !chatInputValue.trim() || !isGeminiClientInitialized}
            variant="primary"
            size="sm"
            accentColorName={accentColorName}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
        <div className="mt-1.5">
          <label className="flex items-center space-x-1.5 text-xs text-[var(--ctp-subtext0)] cursor-pointer group">
            <input
              type="checkbox"
              checked={useGoogleSearch}
              onChange={(e) => setUseGoogleSearch(e.target.checked)}
              className="appearance-none h-3.5 w-3.5 border-2 border-[var(--ctp-surface2)] rounded-sm bg-[var(--ctp-surface0)]
                           checked:bg-[var(--dynamic-accent)] checked:border-transparent focus:outline-none 
                           focus:ring-2 focus:ring-offset-0 focus:ring-[var(--dynamic-accent)] focus:ring-opacity-50
                           transition duration-150 group-hover:border-[var(--ctp-overlay1)]"
              disabled={!isGeminiClientInitialized}
            />
            <span className="group-hover:text-[var(--ctp-text)]">Use Google Search 🌍 (disables OBS actions)</span>
          </label>
        </div>
        {/* Suggestions moved to Gemini welcome message */}
      </div>
    </div>
  );
};
