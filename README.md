# 100-Day Stock Fantasy Challenge (Vite)

A neon trading-floor fantasy league where players lock in one stock per category and compete over 100 days. Live quotes are fetched from Google Finance (via SerpAPI) and enriched with Finviz fundamentals, then cached to protect rate limits.

## Features

- **Vite + React + Tailwind** UI with a dark, neon green dashboard aesthetic.
- **Supabase auth** (email/password + Google) with verification gating.
- **Live market data** from Google Finance and Finviz.
- **10 categories × 10 stocks** with one pick per category.
- **Leaderboard + portfolio API** scaffolding via Express + MongoDB.
- **Auto-refresh** every 45 seconds with server-side caching.
- **Rate limiting** on the API to protect SerpAPI.

## Quickstart

1. Copy `.env.example` to `.env` and fill in your keys.
2. Install dependencies: `npm install`.
3. Start the backend: `npm run server`.
4. Start the frontend: `npm run dev`.

## Environment variables

| Variable | Description | Required |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `VITE_API_BASE_URL` | Backend base URL | Yes |
| `SERPAPI_KEY` | SerpAPI key for Google Finance | Yes |
| `MONGODB_URI` | MongoDB connection string | Optional |
| `PRICE_CACHE_TTL_MS` | Cache duration for quotes (ms) | Optional |
| `QUOTE_CONCURRENCY` | Max concurrent quote fetches | Optional |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | Optional |
| `RATE_LIMIT_MAX` | Max requests per window | Optional |
| `VITE_CHALLENGE_START_DATE` | Start date for 100-day timer | Optional |

## Scripts

- `npm run dev` — start Vite
- `npm run build` — type-check + build
- `npm run preview` — preview build
- `npm run server` — start Express API
