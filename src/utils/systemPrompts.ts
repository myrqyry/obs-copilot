// Utility functions for building system prompts for different services

export interface ObsData {
    scenes: any[];
    currentProgramScene?: string;
    sources: any[];
    streamStatus?: any;
    recordStatus?: any;
    videoSettings?: any;
}

export function buildObsSystemMessage(obsData: ObsData): string {
    const sceneNames = obsData.scenes.map((s: any) => s.sceneName).join(', ');
    const sourceNames = obsData.sources.map((s: any) => s.sourceName).join(', ');
    const currentScene = obsData.currentProgramScene || 'None';

    // Fix stream and record status to check outputActive property
    const streamStatus = obsData.streamStatus?.outputActive
        ? `Active (${Math.floor((obsData.streamStatus.outputDuration || 0) / 60)}:${((obsData.streamStatus.outputDuration || 0) % 60).toString().padStart(2, '0')})`
        : 'Inactive';

    const recordStatus = obsData.recordStatus?.outputActive
        ? `Recording (${Math.floor((obsData.recordStatus.outputDuration || 0) / 60)}:${((obsData.recordStatus.outputDuration || 0) % 60).toString().padStart(2, '0')})`
        : 'Not Recording';

    const videoRes = obsData.videoSettings ? `${obsData.videoSettings.baseWidth}x${obsData.videoSettings.baseHeight}` : 'Unknown';

    return `
**OBS Context:**
- Current Scene: ${currentScene}
- Available Scenes: ${sceneNames}
- Available Sources: ${sourceNames}
- Stream Status: ${streamStatus}
- Record Status: ${recordStatus}
- Video Resolution: ${videoRes}

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

Use these action types: createInput, setInputSettings, setSceneItemEnabled, getInputSettings, getSceneItemList, setCurrentProgramScene, setVideoSettings, createScene, removeInput, setSceneItemTransform, createSourceFilter, setInputVolume, setInputMute, etc.
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
