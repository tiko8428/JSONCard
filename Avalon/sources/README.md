# Data sources for Austrian listings

This folder tracks the primary inputs Avalon should ingest to mirror a Zillow-style catalog for Austria. The current focus is breadth and compliance: start with official feeds or clearly permitted scraping targets, and respect each site's robots.txt, rate limits, and terms.

## Top target providers (20)
1. willhaben.at
2. immobilien.net
3. immoscout24.at (Austria)
4. immowelt.at (Austria)
5. wohnnet.at
6. derstandard.at/immobilien
7. immo.kurier.at
8. sreal.at
9. remax.at
10. findmyhome.at
11. bazar.at/immobilien
12. immo.tt.com (Tiroler Tageszeitung)
13. immo.sn.at (Salzburger Nachrichten)
14. immo.oe24.at
15. wohnkrone.at
16. engelvoelkers.com/en-at
17. ehl.at
18. rustler.eu (Real Estate)
19. justimmo.at
20. flatbee.at

The `providers.js` file captures metadata for these sources so ingestion workers can prioritize, filter, or display source-level attribution.

## Suggested ingestion approach
- **APIs/Feeds first:** prefer official APIs (e.g., Justimmo, S REAL, or REMAX partner feeds) when available.
- **HTML fallbacks:** use Cheerio-based parsers with strong selectors and pagination guards. Store canonical listing URLs for attribution.
- **Geocoding:** normalize addresses into latitude/longitude for map views; cache results to control quota usage.
- **Normalization:** map raw fields into a common schema (address, coordinates, price, currency, rooms, floor area, property type, energy label, availability, contact, source URL).
- **Freshness:** record `seenAt`, `lastUpdatedAt`, and `source` identifiers so stale listings can be expired gracefully.

## Files
- `providers.js`: machine-readable provider catalog.
- `index.js`: helper utilities to enumerate providers and scaffold ingestion tasks without hitting the network.
