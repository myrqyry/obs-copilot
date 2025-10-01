import { OBSScene, OBSSource, OBSStreamStatus, OBSRecordStatus, OBSVideoSettings } from '../types';
import { Hotkey } from 'obs-websocket-js';

// Utility functions for building system prompts for different services

export interface ObsData {
  scenes: OBSScene[];
  currentProgramScene?: string;
  sources: OBSSource[];
  streamStatus?: OBSStreamStatus;
  recordStatus?: OBSRecordStatus;
  videoSettings?: OBSVideoSettings;
}

export function buildObsSystemMessage(obsData: ObsData, hotkeys?: Hotkey[]): string {
  const sceneNames = obsData.scenes.map((s: OBSScene) => s.sceneName).join(', ');
  const sourceNames = obsData.sources.map((s: OBSSource) => s.sourceName).join(', ');
  const currentScene = obsData.currentProgramScene || 'None';

  // Fix stream and record status to check outputActive property
  const streamStatus = obsData.streamStatus?.outputActive
    ? `Active (${Math.floor((obsData.streamStatus.outputDuration || 0) / 60)}:${((obsData.streamStatus.outputDuration || 0) % 60).toString().padStart(2, '0')})`
    : 'Inactive';

  const recordStatus = obsData.recordStatus?.outputActive
    ? `Recording (${Math.floor((obsData.recordStatus.outputDuration || 0) / 60)}:${((obsData.recordStatus.outputDuration || 0) % 60).toString().padStart(2, '0')})`
    : 'Not Recording';

  const videoRes = obsData.videoSettings
    ? `${obsData.videoSettings.baseWidth}x${obsData.videoSettings.baseHeight}`
    : 'Unknown';

  // Build hotkeys information
  let hotkeyInfo = '';
  if (hotkeys && hotkeys.length > 0) {
    const hotkeyNames = hotkeys
      .map((h: Hotkey) => h.hotkeyName)
      .filter(Boolean)
      .slice(0, 20); // Limit to first 20
    hotkeyInfo = `\n- Available Hotkeys: ${hotkeyNames.join(', ')}${hotkeys.length > 20 ? ` (and ${hotkeys.length - 20} more)` : ''}`;
  }

  return `
**OBS Context:**
- Current Scene: ${currentScene}
- Available Scenes: ${sceneNames}
- Available Sources: ${sourceNames}
- Stream Status: ${streamStatus}
- Record Status: ${recordStatus}
- Video Resolution: ${videoRes}${hotkeyInfo}

When user asks for OBS actions, respond with a JSON object in your response containing an "obsAction" field. Example:
{
  "obsAction": {
    "type": "createInput",
    "inputName": "My Text",
    "inputKind": "text_gdiplus_v2",
    "inputSettings": {"text": "Hello World"},
    "sceneName": "Scene Name",
    "sceneItemEnabled": true
  }
}

Use these action types: createInput, setInputSettings, setSceneItemEnabled, getInputSettings, getSceneItemList, setCurrentProgramScene, setVideoSettings, createScene, removeInput, setSceneItemTransform, createSourceFilter, setInputVolume, setInputMute, triggerHotkeyByName, getStats, getLogFiles, uploadLog, etc.

For hotkeys, you can use triggerHotkeyByName with the exact hotkey name from the available hotkeys list.
`;
}

export function buildStreamerBotSystemMessage(): string {
  // In the future, we can dynamically fetch and cache actions from Streamer.bot here
  // For now, we'll provide a static guide.
  return `
**Streamer.bot Context:**
- You can control Streamer.bot to perform complex stream automation.
- To do this, respond with a JSON object containing a "streamerBotAction" field.
- The \`type\` should be the Streamer.bot request name (e.g., 'DoAction', 'GetActions').
- The \`args\` object contains the parameters for that request.

**Key Action Types:**
1.  **DoAction**: To run an existing action. Use the action's name or ID.
    - Example: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "My Cool Action" } } } }
2.  **CreateAction**: To create a new, simple action.
    - Example: { "streamerBotAction": { "type": "CreateAction", "args": { "name": "New Greeting" } } }
    - (Note: Complex action creation requires multiple steps)
3.  **Twitch Actions**: Streamer.bot has built-in Twitch actions. You can call them directly.
    - **Create Poll**: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "Twitch Create Poll" }, "args": { "title": "Poll Title", "choices": ["A", "B"], "duration": 120 } } } }
    - **Send Chat Message**: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "Twitch Send Message" }, "args": { "message": "Hello from the bot!" } } } }

When a user asks for a Streamer.bot action, use this format.
`;
}

export function buildMarkdownStylingSystemMessage(): string {
  return `
**Enhanced Markdown Styling Capabilities:**

You have access to powerful GSAP-animated text effects! Use these special syntax patterns to make your responses visually engaging:

🌈 **TEXT EFFECTS:**
- {{rainbow:text}} - Animated rainbow gradient
- {{glow:text}} - Pulsing bloom glow effect
- {{glow-green:text}} {{glow-blue:text}} {{glow-red:text}} {{glow-yellow:text}} {{glow-purple:text}} - Colored glow effects
- {{fade-glow:text}} - Gentle breathing glow
- {{sparkle:text}} - Animated sparkles ✨
- {{bounce:text}} - Playful bouncing animation
- {{slide-in:text}} - Slides in from left
- {{typewriter:text}} - Types out character by character

🎨 **HIGHLIGHTS:**
- {{highlight:text}} - Yellow highlight with entrance animation
- {{highlight-green:text}} - Green highlight  
- {{highlight-blue:text}} - Blue highlight

📊 **STATUS BADGES:**
- {{success:text}} - Green badge with ✅
- {{error:text}} - Red badge with ❌
- {{warning:text}} - Yellow badge with ⚠️
- {{info:text}} - Blue badge with ℹ️
- {{tip:text}} - Purple badge with 💡

🎬 **STREAMING SPECIFIC:**
- {{stream-live:text}} - Animated LIVE indicator 🔴
- {{obs-action:text}} - OBS action badge 🎬
- {{custom-action:text}} - Custom action badge 🎯

📝 **INTERACTIVE:**
- {{collapse:title}} - Collapsible section

**USAGE EXAMPLES:**
"{{rainbow:Welcome}} to your stream! Your viewer count is {{highlight-green:1,234}}!"
"{{success:Scene activated}} - {{obs-action:Camera enabled}}"
"{{glow-blue:New follower!}} {{sparkle:Thank you for following!}}"
"{{typewriter:Setting up your stream...}}"

Use these effects to make your responses more engaging and visually appealing for streamers!
`;
}
