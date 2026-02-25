# SofaScore Proxy API Documentation & Configuration Guide

This document provides a comprehensive overview of how to set up and use the SofaScore proxy API. This configuration is designed to allow a mobile or web application to fetch sports data from SofaScore without hitting CORS issues or basic anti-bot blocks.

## 1. Backend Infrastructure (Express.js)

The proxy is built using Node.js and Express. It acts as a middleman between your client application and the SofaScore API.

### Core Dependencies
- `express`: Web framework.
- `node-fetch` (or native `fetch` in Node 18+): To make outgoing requests to SofaScore.

### Proxy logic (`server/routes.ts`)

The critical part of the proxy is the headers. SofaScore blocks generic scrapers, so you must mimic a browser.

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

### Implementation Example (Data Proxy)
```typescript
async function fetchSofaScore(endpoint: string) {
  const url = `${SOFASCORE_API}${endpoint}`;
  const res = await fetch(url, { headers: SOFASCORE_HEADERS });
  if (!res.ok) throw new Error(`SofaScore API error: ${res.status}`);
  return res.json();
}

// Route usage
app.get("/api/event/:eventId", async (req, res) => {
  const data = await fetchSofaScore(`/event/${req.params.eventId}`);
  res.json(data);
});
```

### Implementation Example (Image Proxy)
Images require converting the response to a buffer and setting the correct `Content-Type`.
```typescript
async function proxyImage(imageUrl: string, res: Response) {
  const response = await fetch(imageUrl, { headers: SOFASCORE_HEADERS });
  const contentType = response.headers.get("content-type") || "image/png";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24h
  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}
```

## 2. Endpoints List

### Matches & Fixtures
- `GET /api/sport/:sport/scheduled-events/:date` (e.g., `/api/sport/football/scheduled-events/2024-03-10`)
- `GET /api/event/:eventId` (Main match info)
- `GET /api/event/:eventId/incidents` (Goals, cards, subs)
- `GET /api/event/:eventId/lineups` (Starting XIs and ratings)
- `GET /api/event/:eventId/statistics` (Possession, shots, etc.)
- `GET /api/event/:eventId/odds/1/all` (Betting odds)
- `GET /api/event/:eventId/h2h/events` (Head-to-head history)

### Standings & Teams
- `GET /api/unique-tournament/:tournamentId/season/:seasonId/standings/total` (League table)
- `GET /api/team/:teamId/events/last/:page` (Team form/results)

### Images
- `GET /api/team/:teamId/image`
- `GET /api/player/:playerId/image`
- `GET /api/unique-tournament/:tournamentId/image`

## 3. Client-Side Integration

### Configuration
In your Expo/React Native app, define a base API URL that points to your proxy server.

```typescript
// lib/api.ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://your-proxy-server.com/api";

export async function fetchMatchDetails(id: string) {
  const response = await fetch(`${API_BASE}/event/${id}`);
  return response.json();
}
```

### Caching Strategy
Use `@tanstack/react-query` to handle data fetching, loading states, and automatic background refreshing.

```typescript
const { data } = useQuery({
  queryKey: ['match', id],
  queryFn: () => fetchMatchDetails(id),
  refetchInterval: 30000, // Refresh every 30 seconds for live matches
});
```

## 4. Deployment Instructions for Agents
When instructing another agent to set this up:
1. **Copy Headers**: Ensure the `SOFASCORE_HEADERS` are exactly as defined above.
2. **Image Buffering**: Remind the agent to use `arrayBuffer()` and `Buffer.from()` for image proxying, as standard JSON parsing will fail.
3. **CORS**: If using from a web browser, ensure the Express server has `cors` middleware enabled.
4. **Environment Variables**: Set `EXPO_PUBLIC_API_URL` on the frontend to point to the backend's `/api` prefix.
