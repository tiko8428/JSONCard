# ChatGPT / OpenAI Apps integration

This folder prepares Avalon to be callable from ChatGPT using the [OpenAI Apps SDK](https://developers.openai.com/apps-sdk/). The goal is to expose small, well-scoped actions that help users search Austrian properties, summarize matches, and request human follow-up.

## Files
- `routes.js` – Express router that exposes API-friendly endpoints for ChatGPT actions (search, summarize, provider catalog).
- `openai-app.json` – Action manifest aligned with the Apps SDK (schema version `v1`) describing the available endpoints.

## Usage
1. Mount the router inside the existing Express server, ideally under `/Avalon/api`:
   ```js
   const avalonChatRoutes = require("./Avalon/chatgpt-app/routes");
   app.use("/Avalon/api", avalonChatRoutes);
   ```
2. Serve `openai-app.json` at a discoverable URL (e.g., `/Avalon/.well-known/ai-plugin.json`) so the Apps SDK can register the actions.
3. When deploying to `https://thegeneralapps.com/Avalon`, ensure CORS allows ChatGPT origins and that TLS certificates are valid.

## Action principles
- **Deterministic JSON:** respond with predictable fields (`summary`, `items`, `meta`) to keep ChatGPT prompts simple.
- **Fast responses:** precompute or cache normalized listings; stream summaries only when a longer list is requested.
- **Attribution:** return `source` and `sourceUrl` for every listing to respect provider ownership.
- **Safety:** throttle search breadth and enforce input validation (location bounding boxes, max page size) before hitting upstream providers.
