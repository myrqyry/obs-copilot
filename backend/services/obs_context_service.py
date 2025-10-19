import json
from typing import Dict, List, Optional, Tuple
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

    def build_context_prompt(self, obs_state: OBSContextState, user_input: str) -> Tuple[str, str]:
      """
      Build a pair of messages suitable for role-based LLM inputs.

      Returns a tuple (system_message, user_message).

      Important: the user input is returned as the separate "user_message"
      rather than being interpolated into the system message. This keeps
      system instructions distinct from untrusted user content and reduces
      the risk of prompt injection.
      """

      # Construct the stable system-side context (OBS state + role instruction)
      system_parts = [self.base_system_instruction.strip(), "\n", "CURRENT OBS STATE:"]
      system_parts.append(f"Scene: {obs_state.current_scene}")
      system_parts.append(f"Available Scenes: {', '.join(obs_state.available_scenes)}")
      system_parts.append(f"Active Sources: {len(obs_state.active_sources)} sources")
      system_parts.append(f"Streaming: {'Active' if obs_state.streaming_status else 'Inactive'}")
      system_parts.append(f"Recording: {'Active' if obs_state.recording_status else 'Inactive'}")
      system_parts.append("RECENT COMMANDS (last 5):")
      system_parts.append(json.dumps(obs_state.recent_commands[-5:], indent=2))

      system_message = "\n".join(system_parts)

      # Return the user message separately (sanitized minimally here by stripping)
      # Note: further sanitization (length limits, forbidden tokens) could be applied
      # by callers if stricter policies are required.
      user_message = (user_input or "").strip()

      return system_message, user_message