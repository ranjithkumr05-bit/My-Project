// Regenerates API.md from the live route table. Run: node scripts/gen-api-md.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as routesNs from '../src/routes.mjs'

const ROUTES = routesNs.routes || routesNs.default || routesNs

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const table = [
  '| Method | Path | Auth |',
  '|---|---|---|',
  ...ROUTES.map((r) => `| ${r.method} | ${r.path} | ${r.auth || 'public'} |`),
].join('\n')

const doc = `# Customwear Platform — API Reference

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

${table}

## Verification
Run \`npm run smoke\` — boots the server on an isolated port and exercises every route group (18 checks).
`
writeFileSync(path.join(ROOT, 'API.md'), doc)
console.log('API.md written,', ROUTES.length, 'routes')
