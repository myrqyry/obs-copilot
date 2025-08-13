---
title: "OBS Copilot Architecture Overview"
description: "High-level architecture of the OBS Copilot project"
author: "Cline AI"
version: 1.0
tags: ["architecture", "obs", "streaming", "ai"]
last_updated: "2025-08-11"
---

# OBS Copilot Architecture

## Overview
OBS Copilot is a VSCode extension that provides AI assistance for live streaming setups. It consists of:

1. **Core Extension**: TypeScript backend managing state and OBS connections
2. **Webview UI**: React-based interface for user interaction
3. **MCP Integration**: Model Context Protocol for external tool integration
4. **API Services**: Handlers for various media APIs (GIPHY, Unsplash, etc.)

## Key Components

```mermaid
graph TB
    subgraph VSCode[VSCode Environment]
        Extension[Core Extension]
        Webview[React Webview]
        Extension <--> Webview
    end

    subgraph External[External Services]
        OBS[OBS Studio]
        StreamerBot[Streamer.bot]
        Gemini[Gemini API]
        Extension <--> OBS
        Extension <--> StreamerBot
        Extension <--> Gemini
    end
```

## Data Flow
1. User interacts with Webview UI
2. Commands sent to Core Extension
3. Extension communicates with OBS/Streamer.bot
4. AI services process requests
5. Results displayed in Webview
