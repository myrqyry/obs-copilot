# 🤖 Project Agents & Tools

This document outlines the key agents and tools that are integrated into the `obs-copilot` project. These agents are designed to automate tasks, provide intelligent assistance, and enhance the overall streaming experience.

---

### 1. Gemini AI Agent
* **Purpose**: The core AI for the `obs-copilot` dock. It provides a conversational interface for managing OBS Studio and creating automation rules.
* **Location**: `src/constants/prompts/geminiSystemPrompt.md`, `src/features/chat/`, `src/services/geminiService.ts`
* **Capabilities**:
    * Natural language interaction for controlling OBS.
    * Generates and suggests automation rules based on user input.
    * Provides information and suggestions related to streaming.

### 2. Streamer.bot Integration Agent
* **Purpose**: Facilitates communication with a local Streamer.bot instance to trigger advanced actions and events.
* **Location**: `src/services/streamerBotService.ts`
* **Capabilities**:
    * Connects to and receives events from Streamer.bot.
    * Sends commands to Streamer.bot to run actions.
    * Supports a variety of actions, including chat messages and managing scenes.

### 3. OBS Studio Connection Manager
* **Purpose**: Handles the WebSocket connection to OBS Studio, allowing the application to receive events and send commands.
* **Location**: `src/features/connections/ConnectionPanel.tsx`, `src/hooks/useObsActions.ts`
* **Capabilities**:
    * Connects to OBS Studio via a user-configured WebSocket server.
    * Provides a standardized way to interact with OBS, such as switching scenes, controlling sources, and managing the streaming status.

### 4. Media System Agent
* **Purpose**: Manages media playback and text-to-speech (TTS) functionalities.
* **Location**: `src/services/ttsService.ts`
* **Capabilities**:
    * Plays audio files from a defined directory.
    * Converts text into speech and plays it through the specified output.
    * Handles music queueing and playback.

---

By referencing these agents and their locations, collaborators can more easily understand the project's architecture and contribute effectively. Keep this file updated to reflect any new agents or significant changes.