# Sports Fixtures Proxy API Documentation & Configuration Guide

This document provides a comprehensive overview of how to set up and use the sports data proxy API for both **Football** and **Basketball**. This configuration allows applications to fetch data from SofaScore without CORS issues or anti-bot blocks.

## 1. Backend Infrastructure (Express.js)

The proxy is built using Node.js and Express. It acts as a middleman between your client application and the SofaScore API.

### Core Dependencies
- `express`: Web framework.
- `node-fetch` (or native `fetch` in Node 18+): For outgoing requests.

### Proxy headers (`server/routes.ts`)

These headers are essential to mimic a standard browser request.

```typescript
const SOFASCORE_API = "https://api.sofascore.com/api/v1";

const SOFASCORE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.sofascore.com/",
  "Origin": "https://www.sofascore.com",
  "Cache-Control": "no-cache",
};
```

## 2. Endpoints List

### Fixtures & Events (Football & Basketball)
- `GET /api/sport/:sport/scheduled-events/:date`
  - Valid `:sport` values: `football`, `basketball`.
  - `:date` format: `YYYY-MM-DD`.
  - Fetch all scheduled matches for the given sport and date.
- `GET /api/event/:eventId`
  - Main match info (teams, scores, status, venue).
- `GET /api/event/:eventId/incidents`
  - Match events (Goals/Cards for Football; Quarter scores/Timeouts for Basketball).
- `GET /api/event/:eventId/lineups`
  - Starting players, benches, and coaches.
- `GET /api/event/:eventId/statistics`
  - Detailed stats (Possession, Shots, Corners for Football; Rebounds, Assists, FG% for Basketball).
- `GET /api/event/:eventId/odds/1/all`
  - Betting odds for various markets.
- `GET /api/event/:eventId/h2h/events`
  - Historical head-to-head match results.

### League & Team Data
- `GET /api/unique-tournament/:tournamentId/season/:seasonId/standings/total`
  - League tables and standings.
- `GET /api/team/:teamId/events/last/:page`
  - Recent match history for a specific team.

### Media (Image Proxy)
- `GET /api/team/:teamId/image`
- `GET /api/player/:playerId/image`
- `GET /api/unique-tournament/:tournamentId/image`

## 3. Implementation Details

### Data Fetching
```typescript
async function fetchSofaScore(endpoint: string) {
  const url = `${SOFASCORE_API}${endpoint}`;
  const res = await fetch(url, { headers: SOFASCORE_HEADERS });
  if (!res.ok) throw new Error(`SofaScore API error: ${res.status}`);
  return res.json();
}
```

### Image Proxying (Critical)
Images must be handled as buffers to preserve binary data.
```typescript
async function proxyImage(imageUrl: string, res: Response) {
  const response = await fetch(imageUrl, { headers: SOFASCORE_HEADERS });
  const contentType = response.headers.get("content-type") || "image/png";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400");
  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}
```

## 4. How to Setup for New Projects
1. **Express Server**: Create an Express app and register the routes mapping to the endpoints above.
2. **Environment Variables**: Define `EXPO_PUBLIC_API_URL` pointing to your Express server's `/api` path.
3. **Frontend Integration**: Use `@tanstack/react-query` for efficient data fetching and caching.
4. **CORS**: If running on web, remember to enable `cors` middleware in your Express app.
