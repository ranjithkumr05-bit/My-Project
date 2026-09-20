# Customwear Platform — API Reference

Phase: sample-data (in-memory store seeded from data/*.json). **No database connected.**

## Auth
- Bearer token via POST /api/auth/login. Tokens are in-memory; POST /api/auth/logout invalidates.
- Roles: admin (full access) / customer (scoped to own customerId).
- Test creds: admin@customwear.sample/admin123, buyer@greenfield.sample/buyer123.

## Conventions
- 404 unknown path; 405 wrong verb (with Allow list); 401 missing/invalid token; 403 wrong role or foreign resource.
- CORS: GET/POST/PATCH with JSON bodies; max body 256 KB.
- WhatsApp CTA: GET /api/whatsapp/cta returns configured:false + null url until WHATSAPP_NUMBER env is set (honest, never fabricated).
- Optional persistence: PERSIST=1 writes mutations to runtime.json (still not a database).

## Health
GET /api/health -> { phase: 'sample-data', database: 'not connected', counts: {...} }

## Routes

| Method | Path | Auth |
|---|---|---|
| GET | /api/health | public |
| POST | /api/auth/login | public |
| POST | /api/auth/logout | public |
| GET | /api/auth/me | public |
| GET | /api/catalogue/categories | public |
| GET | /api/catalogue/branding | public |
| GET | /api/catalogue/fabrics | public |
| GET | /api/catalogue/stages | public |
| GET | /api/products | public |
| GET | /api/products/:id | public |
| GET | /api/whatsapp/cta | public |
| GET | /api/reference | public |
| POST | /api/rfqs | public |
| GET | /api/rfqs | public |
| GET | /api/rfqs/:id | public |
| PATCH | /api/rfqs/:id | public |
| PATCH | /api/rfqs/:id/status | public |
| POST | /api/orders | public |
| GET | /api/orders | public |
| GET | /api/orders/:id | public |
| PATCH | /api/orders/:id/stage | public |
| PATCH | /api/orders/:id/status | public |
| POST | /api/rfqs/:id/convert | public |
| POST | /api/leads | public |
| GET | /api/leads | public |
| GET | /api/leads/:id | public |
| PATCH | /api/leads/:id | public |
| GET | /api/customers | public |
| GET | /api/customers/me | public |
| GET | /api/customers/:id | public |
| POST | /api/samples | public |
| GET | /api/samples | public |
| GET | /api/samples/:id | public |
| PATCH | /api/samples/:id/status | public |
| GET | /api/admin/dashboard | public |
| GET | /api/admin/events | public |

## Verification
Run `npm run smoke` — boots the server on an isolated port and exercises every route group (18 checks).
