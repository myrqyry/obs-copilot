## Development Setup

Use `pnpm` and `uv` to set up and run the application locally. These scripts are set up in the `package.json` and `scripts/` folder.

1. Install project dependencies and backend environment:

```bash
pnpm setup
```

2. Start the dev servers (frontend + backend):

```bash
pnpm dev
```

If you want to run the backend directly, use `uv run uvicorn main:app --reload` inside the `backend/` folder after setting up the environment with `uv install`.

# OBS Copilot

This project is an OBS Studio dock for AI-powered streaming control. It uses Gemini AI to intelligently control OBS scenes, sources, and settings through the OBS WebSocket protocol.

## API Documentation

The FastAPI backend provides automatically generated API documentation. Once the backend server is running, you can access the documentation at the following endpoints:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)