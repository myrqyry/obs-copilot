# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with TypeScript support

### Environment Setup
Environment variables are handled through `.env.local` file:
- `VITE_GEMINI_API_KEY` or `API_KEY` - Google Gemini API key
- `VITE_GIPHY_API_KEY` - Giphy API key (optional)

Default OBS WebSocket URL: `ws://localhost:4455`

## Architecture Overview

This is a React 19 + TypeScript application that serves as an OBS Studio control panel with AI-powered assistance via Google Gemini. The app can be used as a standalone web application or embedded as an OBS dock.

### Core Architecture Layers

**State Management (Zustand)**
- `src/store/appStore.ts` - Centralized application state using Zustand
- Handles OBS connection state, chat messages, UI preferences, and theme management
- Persists user settings via localStorage with fallback handling

**Service Layer**
- `src/services/obsService.ts` - OBS WebSocket communication wrapper
- `src/services/geminiService.ts` - Google Gemini AI integration
- `src/services/streamerBotService.ts` - Streamer.bot automation integration
- `src/services/htmlTemplateService.ts` - HTML template generation for browser sources

**OBS Integration**
- Uses `obs-websocket-js` library for real-time OBS Studio communication
- Comprehensive OBS action system with 190+ supported operations
- Real-time event synchronization for scenes, sources, streaming, and recording status
- Support for advanced features like filters, transforms, and studio mode

**AI Integration**
- Google Gemini integration with structured OBS action responses
- Context-aware AI assistant that understands OBS state
- Special effect markdown rendering with glow effects, badges, and animations
- Conversation-driven OBS control with natural language commands

### Component Structure

**Main Application Flow**
- `src/App.tsx` - Root component with tab navigation and connection management
- Tab-based interface: Assistant (Gemini), OBS Controls, Streaming Assets, Settings, Connections, Advanced

**UI Components**
- `src/components/ui/` - Modern design system components (Button, Card, etc.)
- `src/components/common/` - Shared UI components and utilities
- `src/components/chat/` - Chat interface with markdown rendering and special effects

**Theming System**
- Dual theming approach: Legacy Catppuccin colors + new semantic design system
- CSS custom properties for dynamic theme switching
- 13 accent color combinations with GSAP-powered animations
- Full dark mode support with extraDarkMode option

### Key Technical Patterns

**TypeScript Configuration**
- Strict mode enabled with comprehensive linting
- Path aliases configured (`@/*` maps to `src/*`)
- React 19 JSX transform

**Animation System**
- GSAP 3.13.0 for professional animations and transitions
- Morphing logos and smooth tab transitions
- Special effect rendering in chat messages

**Persistence Strategy**
- localStorage-based settings persistence with availability checks
- Connection settings auto-save for seamless reconnection
- User preferences and theme persistence across sessions

**Error Handling**
- Graceful OBS connection failure handling
- AI service initialization error recovery
- Comprehensive error messaging with user-friendly dialogs

## Development Guidelines

### Adding New OBS Actions
1. Define action type in `src/types/obsActions.ts`
2. Implement handler in `appStore.ts` `handleObsAction` method
3. Add corresponding method to `OBSWebSocketService` if needed
4. Update AI system prompt in `src/constants.ts` with new action

### Working with Themes
- Use semantic CSS variables (--primary, --secondary, etc.) for new components
- Legacy Catppuccin variables available for backward compatibility
- Theme changes update CSS custom properties dynamically

### Component Development
- Use the `cn()` utility from `src/lib/utils.ts` for class merging
- Leverage UI components from `src/components/ui/` as building blocks
- Follow the semantic design system for consistency

### State Management
- Prefer Zustand store actions over local state for shared data
- Use selectors to optimize re-renders
- Persist important user preferences automatically

## Special Features

### AI-Powered OBS Control
The application features a sophisticated AI integration that can:
- Execute OBS commands through natural language
- Provide contextual streaming advice
- Generate special effects in responses (glow, badges, animations)
- Maintain conversation context across sessions

### Multi-Service Integration
- OBS Studio via WebSocket protocol
- Streamer.bot for advanced automation
- Google Gemini for AI assistance
- Giphy API for animated content

### Browser Source Templates
Built-in HTML template system for creating OBS browser sources with:
- Responsive design
- Custom styling
- Dynamic content integration

### Development Server
Vite-powered development with:
- Hot reload for React components
- TypeScript compilation
- Environment variable injection
- GSAP optimization for production builds

## Testing OBS Integration

To test OBS features:
1. Start OBS Studio
2. Enable WebSocket Server (Tools → WebSocket Server Settings)
3. Note the port (default: 4455) and password
4. Start the development server
5. Connect via the Connections tab
6. Test basic operations (scene switching, source visibility)

## Production Deployment

The app builds to a static site suitable for:
- Web hosting services
- Local OBS dock integration
- Browser source embedding

Build artifacts are optimized with GSAP code splitting and proper asset handling for OBS compatibility.