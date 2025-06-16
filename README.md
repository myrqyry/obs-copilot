# 🎬 obs-copilot

<div align="center">

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-3.13.0-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)

**🤖 OBS Studio Control with LLM Chat Interface & Intelligent  Assistant.**

*Seamlessly control your OBS Studio setup with natural language + the power of Google's Gemini Models*

> ⚠️ **Early Development Stage**: This project is in active development. Some features may be experimental or subject to change.

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [🛠️ Tech-Stack](#️-tech-stack) • [📱 Usage](#-usage) • [💅 Visuals](#-visuals) • [🎨 Customization](#-customization)

</div>

---

## 🌟 Overview

**obs-copilot** is a React-based dock application that has the possibility to transforms how you interact with OBS Studio. By combining the robust OBS WebSocket protocol with Google's Powerful Gemini AI, this tool provides an intelligent, **conversational interface** for managing your streaming and recording setup.

---
### 🎯 What Makes It Special?

- 🧠 **AI-Powered Control**: Natural language commands powered by Gemini  
- 🔗 **Real-time OBS Integration**: Direct WebSocket connection to OBS Studio  
- 🎨 **Beautiful UI**: Catppuccin-themed interface with smooth GSAP animations  
- 🎬 **Comprehensive Controls**: Manage scenes, sources, streaming, recording, and settings 

---

## ✨ Features

### 🤖 AI Assistant
- **Conversational Control**: Ask Gemini to perform OBS operations in natural language
- **Context-Aware Responses**: AI understands your current OBS state and setup
- **Smart Suggestions**: Get intelligent recommendations for your streaming workflow
- **Error Handling**: Friendly error messages and troubleshooting guidance

### 🎬 OBS Studio Integration
- **Scene Management**: Switch between scenes, create new ones, manage scene items
- **Source Control**: Toggle source visibility, modify source settings
- **Streaming & Recording**: Start/stop streams and recordings with status monitoring
- **Video Settings**: Adjust resolution, FPS, and other video parameters
- **Real-time Updates**: Live sync with OBS Studio changes

### 🎨 User Experience
- **Smooth Animations**: GSAP-powered transitions and morphing logos
- **Responsive Design**: Works on any screen size
- **Customizable Themes**: Choose from 13 accent color combinations
- **Connection Status**: Clear visual feedback for OBS and Gemini connections
- **Error Recovery**: Graceful handling of connection issues

### 🔧 Advanced Features
- **Filter Management**: Control source filters and effects
- **Audio Controls**: Manage input volumes and monitor types
- **Studio Mode**: Support for preview/program workflow
- **Hotkey Triggers**: Execute OBS hotkeys through AI commands
- **Screenshot Capture**: Save screenshots programmatically

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **OBS Studio** with WebSocket server enabled
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/myrqyry/obs-copilot.git
   cd obs-copilot
   ```
2. **Install dependencies**  
   ```bash
   npm install
   ```
3. **Configure environment**  
   ```bash
   # Create .env.local file
   echo "API_KEY=your_gemini_plus_api_key_here" > .env.local
   ```
4. **Setup OBS Studio**  
   - Open OBS Studio  
   - Go to **Tools** → **WebSocket Server Settings**  
   - Enable **WebSocket Server**  
   - Note the port (default: 4455) and password (if set)
5. **Start the application**  
   ```bash
   npm run dev
   ```
6. **Open in browser**  
   Navigate to `http://localhost:3000`
7. **Add as OBS Dock (Optional)**  
   - In OBS Studio, go to **View** → **Docks** → **Custom Browser Docks...**  
   - Click the **+** button to add a new dock  
   - Set **Dock Name** to "obs-copilot gemini++"  
   - Set **URL** to `http://localhost:3000`  
   - Click **Apply** and **Close**  

---

## 📱 Usage

### Initial Setup

1. **Launch the app** to open the connection modal  
2. **Enter OBS WebSocket URL** (default: `ws://localhost:4455`)  
3. **Add password** if configured in OBS  
4. **Enter your Gemini API key** if not set in **.env.local**  
5. **Click Connect** to start controlling OBS with AI

### AI Commands Examples

```
🎤 "Start streaming to my main platform"
🎬 "Switch to the 'Gaming' scene"
🔇 "Mute the microphone source"
📷 "Create a new webcam source"
⚙️ "Set the video resolution to 1920x1080"
🎨 "Apply a color correction filter to my camera"
📱 "Show me the current streaming status"
```

### Manual Controls
- **Scenes Tab**: Visual scene switcher with source management  
- **Settings Tab**: Video settings editor with theme customization  
- **Connection Tab**: Manage OBS and Gemini connections  

---

## 🛠️ Tech Stack

### Core Technologies
- **⚛️ React 19.1.0** - Modern UI framework
- **📘 TypeScript 5.2.2** - Type-safe development
- **⚡ Vite 5.3.1** - Lightning-fast build tool
- **🎨 Tailwind CSS 3.4.4** - Utility-first styling

### Integrations
- **🧠 Google Gemini++ AI** - Advanced language model integration
- **📡 OBS WebSocket 5.0.6** - Real-time OBS Studio communication
- **🎪 GSAP 3.13.0** - Professional animations and transitions

### Design System
- **🌈 Catppuccin Theme** - Beautiful, consistent color palette
- **📱 Responsive Design** - Mobile-first approach
- **♿ Accessibility** - WCAG-compliant components

---

## 🎨 Customization

### Theme Colors
Choose from 13 beautiful accent colors:
- 🌸 Rosewater • 🦩 Flamingo • 💕 Pink • 🔮 Mauve  
- ❤️ Red • 🍷 Maroon • 🍑 Peach • 💛 Yellow  
- 💚 Green • 🌊 Teal • ☁️ Sky • 💎 Sapphire  
- 💙 Blue • 💜 Lavender

### Advanced Configuration

```typescript
// src/constants.ts
export const DEFAULT_OBS_WEBSOCKET_URL = "ws://localhost:4455";
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
```

---

## 🔧 Development

### Build Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint checks
```

### Project Structure
```
src/
├── components/
│   └── ...
├── services/
│   └── ...
├── types.ts
├── constants.ts
└── App.tsx
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OBS Studio** team for the incredible streaming software  
- **Google** for the powerful Gemini AI API  
- **Catppuccin** community for the beautiful color palette  
- **GreenSock** for