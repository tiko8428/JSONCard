# Avalon Real Estate Hub

Avalon is a Zillow-inspired experience tailored to Austrian real estate. It provides a single entry point for discovering properties, monitoring markets, and exposing the catalog through a ChatGPT-ready API surface. The folder is structured to keep data gathering, enrichment, and conversational access loosely coupled so each piece can evolve independently.

## Goals
- Aggregate listings from leading Austrian property portals with normalized metadata (pricing, location, property type, amenities, energy ratings).
- Offer consumer-friendly discovery features (search, saved filters, alerts, map-friendly coordinates, valuations, and neighborhood insights) similar to Zillow while respecting the data policies of each source.
- Expose an **OpenAI Apps SDK**-compatible action layer so ChatGPT can search, summarize, and route user intents to Avalon endpoints.
- Prepare for deployment at `https://thegeneralapps.com/Avalon` by keeping routes and manifests portable into the existing Express server.

## Folder layout
- [`sources/`](./sources/): data ingestion plans and provider catalog for the top Austrian real-estate sites.
- [`chatgpt-app/`](./chatgpt-app/): API stubs and manifest material to make Avalon discoverable and callable from ChatGPT via the OpenAI Apps SDK.
- [`../static/Avalon/`](../static/Avalon/): the production-ready Zillow-style website served at `/Avalon` (map, filters, favorites, and provider roster all run client-side from JSON).

## Implementation blueprint
1. **Provider ingestion**
   - Prioritize the providers listed in `sources/providers.js`.
   - Start with partner-friendly feeds or APIs where available; fall back to HTML ingestion that respects robots.txt and rate limits.
   - Normalize listings into a shared schema (address, coordinates, price, currency, rooms, square meters, property type, energy certificate, contact info, URL).
2. **Listing experience**
   - Build search endpoints that filter by location, price range, property type, and availability (buy/rent/new build).
   - Add derived signals: price-per-square-meter, historical changes, neighborhood summaries, school/transport overlays, and estimated mortgage/affordability helpers.
3. **ChatGPT/App integration**
   - Keep the action router in `chatgpt-app/routes.js` in sync with the OpenAI App manifest in `chatgpt-app/openai-app.json`.
   - Return concise JSON responses with `summary` and `items` fields so ChatGPT can readily format answers.
4. **Deployment**
- Mount the chat router under `/Avalon/api` (or reverse-proxy it) and host the manifest at `/Avalon/.well-known/ai-plugin.json` or similar so `https://thegeneralapps.com/Avalon` can advertise capabilities to the Apps SDK.

### Front-end runtime
- Serve `static/Avalon/index.html` from `/Avalon` (the existing Express static middleware already exposes this path).
- Listings and provider metadata live in `static/Avalon/data/*.json` so the page can hydrate without a backend.
- Leaflet powers the live map; filtering, sorting, downloads, and favorites are handled in `static/Avalon/main.js`.

## Next steps
- Implement concrete scrapers/feeds per provider respecting licensing and anti-bot terms.
- Add persistence for normalized listings (e.g., MongoDB collection) and caching for geocoding calls.
- Wire authentication/quotas for API consumers and ChatGPT action calls.
