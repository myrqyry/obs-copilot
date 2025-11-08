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
You are an expert OBS Studio AI assistant. Your role is to interpret natural language commands and translate them into actions for OBS.
"""
        self.json_system_instruction = """
You are an expert OBS Studio AI assistant. Your role is to interpret natural language commands and translate them into a structured JSON format representing OBS WebSocket API calls.

Based on the user's request and the current OBS state, determine the appropriate sequence of actions.
Your response MUST be a JSON object that strictly adheres to the provided schema.

The JSON object must contain two fields:
1. `actions`: A list of one or more action objects.
   - Each action object must have a `command` (string) and an optional `args` (dictionary).
   - The `command` must be a valid OBS WebSocket request type (e.g., 'SetCurrentProgramScene', 'SetInputMute').
2. `reasoning`: A clear, step-by-step explanation of why you chose these specific actions to fulfill the user's request.
"""

    def build_context_prompt(self, obs_state: OBSContextState, user_input: str, is_json_output: bool = False) -> Tuple[str, str]:
        """
        Build a pair of messages suitable for role-based LLM inputs.
        Returns a tuple (system_message, user_message).
        """
        instruction = self.json_system_instruction.strip() if is_json_output else self.base_system_instruction.strip()

        system_parts = [instruction, "\n", "CURRENT OBS STATE:"]
        system_parts.append(f"- Current Scene: {obs_state.current_scene}")
        system_parts.append(f"- Available Scenes: {', '.join(obs_state.available_scenes)}")

        # Add a concise summary of active sources
        if obs_state.active_sources:
             source_names = [s.get('sourceName', 'Unknown') for s in obs_state.active_sources[:5]]
             system_parts.append(f"- Active Sources in Current Scene: {', '.join(source_names)}")

        system_parts.append(f"- Streaming: {'Active' if obs_state.streaming_status else 'Inactive'}")
        system_parts.append(f"- Recording: {'Active' if obs_state.recording_status else 'Inactive'}")

        if obs_state.recent_commands:
            system_parts.append("- RECENT COMMANDS (last 3):")
            # Format recent commands for better readability
            for cmd in obs_state.recent_commands[-3:]:
                cmd_name = cmd.get('command', 'N/A')
                args = json.dumps(cmd.get('args')) if cmd.get('args') else '{}'
                system_parts.append(f"  - {cmd_name}({args})")

        system_message = "\n".join(system_parts)
        user_message = (user_input or "").strip()

        return system_message, user_message