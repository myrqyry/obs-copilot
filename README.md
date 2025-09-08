
# 🎬 obs-copilot gemini++

<div align="center">

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.0.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.13.0-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)

**Next-gen OBS Studio Copilot with Gemini AI, Automation, Music/TTS, and Advanced UI**

</div>

---

## 🚀 Overview

**obs-copilot gemini++** is a modern, AI-powered dock for OBS Studio. It combines real-time OBS control, advanced automation, and a conversational Gemini AI interface with a beautiful, animated UI. The latest version introduces deep music/TTS integration, floating music controls, audio output selection, advanced panels, and a robust automation system.

---

## ✨ Key Features

### 🤖 Gemini AI Chat + Markdown Effects
- Natural language control of OBS and streaming workflows
- Context-aware chat with Gemini 2.5+ models
- Advanced markdown renderer: glowing text, badges, rainbow, GSAP-powered animations
- Smart chat suggestions and context management

### 🎬 OBS Studio Integration
- Scene, source, and filter management
- Streaming/recording controls with live status
- Real-time sync with OBS WebSocket 5.x+
- Studio Mode support, hotkey triggers, screenshot capture

### 🎵 Music & TTS System (NEW)
- Floating music player with mini controller and visualizer
- TTS and music playback with audio output selection
- Music visualizer with GSAP animations
- Audio output selector for routing TTS/music to any device

### ⚡ Automation & Advanced Panels (NEW)
- Automation rule builder: trigger OBS/Streamer.bot actions on events
- AdvancedPanel: quick access to power features and diagnostics
- Streamer.bot integration for event-driven automation

### 🖥️ UI & UX
- Catppuccin color palette, glass morphism, and responsive design
- GSAP-powered transitions, morphing logos, animated tabs
- Extra dark mode, theme switching, and accessibility focus
- Modular component system: chat, music, connection, automation, etc.

---

## 🗂️ Project Structure

```
src/
├── components/
│   ├── chat/                # ChatMessageItem, MarkdownRenderer, etc.
│   ├── common/              # Button, Modal, MusicVisualizer, FloatingMusicPlayer, etc.
│   ├── ui/                  # Card, Tooltip, low-level UI primitives
│   ├── AdvancedPanel.tsx    # Advanced controls & diagnostics
│   ├── AudioOutputSelector.tsx
│   ├── MusicMiniController.tsx
│   ├── TTSAndMusicMiniPlayer.tsx
│   ├── GeminiChat.tsx
│   ├── ObsMainControls.tsx
│   └── ...
├── services/
│   ├── obsService.ts        # OBS WebSocket
│   ├── geminiService.ts     # Gemini AI
│   ├── streamerBotService.ts
│   ├── audioService.ts      # Music/TTS
│   ├── automationService.ts # Automation logic
│   └── ...
├── store/                   # Zustand state management
├── hooks/                   # Custom React hooks
├── utils/                   # Markdown, GSAP, persistence, etc.
├── constants/               # OBS events, chat suggestions
├── types/                   # TypeScript types
├── index.css                # Tailwind, glass morphism, custom effects
├── App.tsx                  # Main app
└── index.tsx                # Entry point
```

---

## 🛠️ Tech Stack

- **React 18** + **TypeScript**: Modern, type-safe UI
- **Vite**: Fast dev/build
- **Zustand**: Global state management
- **Tailwind CSS**: Utility-first styling, Catppuccin palette
- **GSAP**: Advanced UI animations
- **OBS WebSocket 5.x**: Real-time OBS control
- **Google Gemini AI**: LLM chat and automation
- **Streamer.bot**: Streaming automation/events

---

## 🆕 Deep Dive: Newest Features

### 1. Music & TTS System
- **FloatingMusicPlayer**: Persistent, draggable music/TTS player with visualizer and controls
- **MusicMiniController**: Compact controller for quick play/pause/skip
- **TTSAndMusicMiniPlayer**: Unified TTS and music playback, supports multiple output devices
- **AudioOutputSelector**: Route audio to any available output (virtual cables, speakers, etc.)
- **MusicVisualizer**: GSAP-powered waveform and spectrum animations
- **pcmToWavUrl**: Utility for converting PCM audio to WAV for playback

### 2. Automation & Advanced Panels
- **AutomationRuleBuilder**: Visual builder for event-driven automation (OBS, Streamer.bot, custom)
- **automationService**: Central logic for managing triggers, actions, and rules
- **AdvancedPanel**: Power-user panel for diagnostics, quick actions, and advanced settings

### 3. Enhanced Chat & Markdown
- **MarkdownRenderer**: Supports glowing text, badges, rainbow, and animated markdown effects
- **ChatMessageItem**: Rich chat bubbles with context, markdown, and animation
- **Smart Suggestions**: Dynamic chat suggestions based on OBS state and recent actions

### 4. UI/UX Upgrades
- **Glass Morphism**: All panels and modals use glassy, blurred backgrounds
- **AnimatedTitleLogos**: Morphing SVG logos with GSAP
- **Extra Dark Mode**: High-contrast mode for low-light streaming
- **Accessibility**: Focus rings, ARIA labels, keyboard navigation

### 5. Streamer.bot & OBS Integration
- **useStreamerBotActions**: Hooks for Streamer.bot event triggers
- **obsService**: Robust error handling, reconnection, and event mapping
- **obsEvents**: Centralized event constants for automation and chat

---

## ⚡ Quick Start

This guide helps you get OBS Copilot running quickly to explore its core features.

### Prerequisites

- Node.js 18+ and npm 9+
- OBS Studio 29+ with WebSocket server enabled
- All required API keys and configuration values (see `.env.example` for a list)

#### OBS WebSocket Setup Guide

To connect obs-copilot to OBS Studio, you must enable the WebSocket server plugin:

1. **Enable WebSocket Plugin in OBS**:
   - Open OBS Studio.
   - Go to **Tools > WebSocket Server Settings**.
   - Check **Enable WebSocket server**.
   - Set **Server Port** to `4455` (default; change if needed but update the URL accordingly).
   - **Server Password**: Set a secure password (optional but recommended for production). Leave blank for no password.
   - Click **Show Auth Required** if using a password to verify settings.
   - Click **OK** to save.

2. **Connection URL Format**:
   - Use `ws://localhost:4455` for local connections (no password).
   - Use `ws://localhost:4455?password=YOUR_PASSWORD` if a password is set.
   - For remote connections: `ws://YOUR_OBS_IP:4455` (ensure firewall allows port 4455).
   - Secure connections (if enabled): `wss://` instead of `ws://`.

3. **UI Connection in obs-copilot**:
   - In the **Connections** tab, enter the full WebSocket URL in the OBS field.
   - If using a password, append `?password=yourpassword` to the URL.
   - Click **Connect**. The app validates the URL format and handles connection errors gracefully.
   - Status indicators show connection state (connected, loading, error). Toasts provide feedback on failures.

4. **Troubleshooting**:
   - **Connection Failed**: Verify OBS WebSocket is enabled and port 4455 is open (use `netstat -tuln | grep 4455` on Linux/Mac or `netstat -an | findstr 4455` on Windows).
   - **Invalid URL**: Ensure format is `ws://host:port` or `ws://host:port?password=...`. The UI now sanitizes and validates inputs.
   - **Password Issues**: Append `?password=` parameter correctly; avoid special characters in passwords.
   - **Firewall/Remote**: Allow inbound TCP 4455 in firewall; test with `telnet localhost 4455`.
   - **Reconnection**: The app auto-reconnects on disconnects with exponential backoff.
   - **Logs**: Check browser console or app logs for detailed errors (e.g., ObsError details).

For advanced usage, see the [ConnectionsTab.tsx](src/plugins/core/ConnectionsTab.tsx) and [ConnectionForm.tsx](src/plugins/core/ConnectionForm.tsx) for UI implementation details.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/obs-copilot.git
   cd obs-copilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then, open `.env.local` and fill in the required values. **Do not commit `.env.local` to version control.**

### Project Maintenance

#### Cleaning Up

We've included several scripts to help maintain the project:

- `npm run clean`: Cleans up build