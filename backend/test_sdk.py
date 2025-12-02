
import os
import asyncio
from google import genai
from google.genai import types
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

# Mock settings
class Settings:
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

settings = Settings()
print(f"Loaded API Key: {settings.GEMINI_API_KEY[:5]}...{settings.GEMINI_API_KEY[-5:] if settings.GEMINI_API_KEY else 'None'}")

async def main():
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        def control_obs(command: str, args: dict = {}) -> dict:
            return {"status": "queued", "command": command}

        def get_current_time() -> dict:
            return {"current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        tools_list = [control_obs, get_current_time]
        
        system_instruction = "You are a helpful assistant."
        contents = [{"role": "user", "parts": [{"text": "What time is it?"}]}]

        config = types.GenerateContentConfig(
            tools=[types.Tool(function_declarations=[
                types.FunctionDeclaration.from_callable(client=client, callable=t) for t in tools_list
            ])],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            system_instruction=system_instruction
        )

        print("Sending request...")
        response = await client.models.generate_content(
            model="gemini-1.5-flash",
            contents=contents,
            config=config
        )
        print("Response received:")
        print(response)

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
