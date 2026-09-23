# Deploy (Docker + production routing)

## What runs where

- Dev: `npm run dev` — Vite `:5174` (BrowserRouter) proxies `/api` to Node `:4399`.
- Prod (single unit): `node server.mjs` serves `/api/*` JSON **and**
  `frontend/dist` static + SPA fallback. `GET /` uses content negotiation:
  browsers (`Accept: text/html`) get `index.html`; API clients keep the JSON index.
  `GET /api` always returns the JSON index.

## Env

| Var | Default | Purpose |
| --- | ------- | ------- |
| `PORT` | `4300` | HTTP port |
| `HOST` | `0.0.0.0` | bind |
| `FRONTEND_DIST` | `<root>/frontend/dist` | static root override |
| `DATA_DIR` | `<root>/data` | sample-data dir |
| `PERSIST` | unset (`0`) | `1` = write mutations to `data/runtime.json` |
| `WHATSAPP_NUMBER` | unset | enables live WhatsApp CTA URL |
| `WEBHOOK_URL` | unset | RFQ/order event webhook |

Frontend build-time: `VITE_WHATSAPP_NUMBER`, `VITE_API_PROXY` (dev only).

## Docker

```sh
docker build -t customwear:latest .
docker run -p 4300:4300 -e PERSIST=0 customwear:latest
docker compose up --build
```

No daemon was available in this environment, so the image build is
documented but not executed here.

## Routing contract (tested in `npm run smoke` + routing checks)

- `GET /` + `Accept: text/html` → `200 text/html` homepage.
- `GET /` + `Accept: application/json` (or default clients) → `200 application/json` index.
- `GET /api` → `200 application/json` index (Accept-independent).
- `/api/*` before static/fallback; unknown API → JSON 404/405, never HTML.
- `/about`, `/services/:slug` → SPA fallback HTML for browsers; JSON 404 for API clients.
