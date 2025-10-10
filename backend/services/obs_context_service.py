import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class OBSContextState:
    """Represents the current OBS state for AI context building"""
    current_scene: str
    available_scenes: List[str]
    active_sources: List[Dict]
    streaming_status: bool
    recording_status: bool
    recent_commands: List[Dict]
    timestamp: datetime

class OBSContextBuilder:
    """Builds consistent, cacheable context for Gemini API requests"""

    def __init__(self):
        self.base_system_instruction = """
You are an expert OBS Studio AI assistant with deep knowledge of streaming workflows.
Your role is to interpret natural language commands and translate them into specific OBS WebSocket API calls.

CAPABILITIES:
- Scene switching and management
- Source visibility control
- Audio/video device management
- Streaming and recording control
- Filter and effect management
- Scene transition customization

RESPONSE FORMAT:
Always respond with a JSON object containing:
{
  "commands": [
    {
      "method": "OBS_WEBSOCKET_METHOD",
      "params": {...}
    }
  ],
  "explanation": "Brief explanation of what will happen"
}
"""

    def build_context_prompt(self, obs_state: OBSContextState, user_input: str) -> str:
        """
        Build a context prompt optimized for implicit caching.
        Places large, common content at the beginning.
        """
        # Large, stable context first (more likely to be cached)
        context_prefix = f\"\"\"
{self.base_system_instruction}

CURRENT OBS STATE:
Scene: {obs_state.current_scene}
Available Scenes: {', '.join(obs_state.available_scenes)}
Active Sources: {len(obs_state.active_sources)} sources
Streaming: {'Active' if obs_state.streaming_status else 'Inactive'}
Recording: {'Active' if obs_state.recording_status else 'Inactive'}

RECENT COMMANDS (last 5):
{json.dumps(obs_state.recent_commands[-5:], indent=2)}

---
USER REQUEST: "{user_input}"

Analyze the request and provide the appropriate OBS commands:
\"\"\"
        return context_prefix