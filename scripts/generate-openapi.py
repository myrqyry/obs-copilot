# scripts/generate-openapi.py
import json
import os
from backend.main import app

def generate_openapi_schema():
    """
    Generates the OpenAPI schema from the FastAPI app and saves it to a file.
    """
    schema = app.openapi()
    output_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'openapi.json')

    with open(output_path, 'w') as f:
        json.dump(schema, f, indent=2)

    print(f"✅ OpenAPI schema generated at {output_path}")

if __name__ == "__main__":
    generate_openapi_schema()
