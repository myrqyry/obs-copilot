# 🎬 obs-copilot gemini++

<div align="center">

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
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

- **React 19** + **TypeScript**: Modern, type-safe UI
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
- Google Cloud API key with Gemini Pro access
- (Optional) Streamer.bot for advanced automation

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

3. Copy the example environment file and update with your API keys:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your API keys.

### Project Maintenance

#### Cleaning Up

We've included several scripts to help maintain the project:

- `npm run clean`: Cleans up build artifacts, cache, and temporary files
- `npm run check-deps`: Checks for unused dependencies
- `npm run lint`: Runs ESLint to check code quality

#### Updating Dependencies

To update dependencies:

```bash
# Check for outdated packages
npm outdated

# Update packages (be cautious with major version updates)
npm update
```

#### Environment Files

- `.env.example`: Template with all required environment variables
- `.env.local`: Local development overrides (not tracked by git)
- `.env`: Production environment variables (not tracked by git)

Never commit sensitive information in `.env` or `.env.local` files.

---

## 🧑‍💻 Usage

- **Connect**: Enter OBS WebSocket URL and Gemini API key
- **Chat**: Use natural language to control OBS, automate, and get suggestions
- **Music/TTS**: Play music, TTS, and control output from any panel
- **Automation**: Build rules to trigger actions on OBS/Streamer.bot events
- **Advanced Panel**: Access diagnostics, quick actions, and advanced settings

---

## 🎨 Customization

- **Themes**: 13 Catppuccin accent colors, extra dark mode, glass morphism
- **Animations**: GSAP-powered transitions, animated markdown, morphing logos
- **Responsive**: Works on all screen sizes, mobile-friendly

---

## 📝 Documentation

- **[PROJECT_RULES_AND_GUIDELINES.md](PROJECT_RULES_AND_GUIDELINES.md)**: Full architecture, coding standards, and component patterns
- **notes/**: Feature guides, animation docs, troubleshooting

---

## 🏗️ Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Lint code
```

---

## 📦 Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run test`: Run tests
- `npm run clean`: Clean up build artifacts and temporary files
- `npm run check-deps`: Check for unused dependencies
- `npm run lint`: Run ESLint for code quality checks
- `npm run proxy`: Start the development proxy server

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

## 🙏 Credits

- OBS Studio, Google Gemini, Catppuccin, GSAP, Streamer.bot, and all open-source contributors.
