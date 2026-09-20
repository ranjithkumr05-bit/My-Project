# Customwear Platform — Project Overview & Handoff
> Generated: 2026-09-20 | Purpose: continue in another chat without re-discovery.
> Rule: No code changes were made for this file. Read-only handoff.

## 1. What this is
B2B apparel manufacturing platform (Tiruppur context). Flow: public marketing site → catalogue → RFQ (MOQ-validated) → admin quote/approve → convert to Order → production stages → leads/samples. Sample-data phase, NO production DB.

Folder: `C:\Users\SURENDHAR\.cline\data\workspaces\chat\customwear-platform\`

## 2. How to run (verified)
- Backend: `set PORT=4399 && node server.mjs` (or `--watch`). Binds 0.0.0.0. Default port 4300 if PORT unset. server.mjs does NOT auto-load `.env.local` (which has PORT=4399) — must be in shell env.
- Frontend: `cd frontend && npx vite --host 0.0.0.0 --port 5174` (already in `dev` script).
- Both: `npm run dev` (concurrently). Install: `npm run install:all`.
- Verify: `Invoke-WebRequest http://localhost:4399/` → 200, `http://localhost:5174/` → 200. Or `npm run smoke` (isolated port 4311, 18 checks).
- URLs: frontend :5174, backend :4399, local + WiFi http://192.168.1.8:PORT. Vite proxy `/api → http://127.0.0.1:4399` (or VITE_API_PROXY).
- Stack: Node>=18, React 18.3.1, Vite 5.4.11, backend zero deps (devDep concurrently 8.2.2).

## 3. Repo map (node_modules excluded)
- Root: `.env.local`(PORT=4399), `.gitignore`, `API.md`, `RUNBOOK.md`, `PROJECT_OVERVIEW.md`(this), `package.json`(start/dev/dev:backend/dev:frontend/install:all/smoke/hash-password), `server.mjs`, `smoke.mjs`, `start-dev.ps1`, `scripts/gen-api-md.mjs`, `scripts/hash-password.mjs`
- `src/`: auth.mjs, http.mjs, notify.mjs, password.mjs, routes.mjs(~700 lines, 38 routes), store.mjs
- `data/`: catalogue.json(12 products/6 branding/6 fabrics), customers.json(6), accounts.json(5 users), operations.json(6 rfqs/4 orders/8 leads/4 samples)
- `frontend/`: index.html(title only), package.json, vite.config.js(host:true,proxy /api,outDir dist), vite.log(stale), public/showcase/(24 files ALL used), src/main.jsx, App.jsx, api.js, ui.jsx, styles.css, pages/{site.jsx 32KB,Login,Customer,Admin,Catalogue,NewRfq,lists,tables,admin-ops,admin-rfqs,admin-orders,admin-samples}

## 4. Backend API (truth from src/routes.mjs)
Conventions: JSON, errors {error,status,details}, CORS GET/POST/PATCH/DELETE, 256KB cap→413, 404 unknown, 405+Allow.
- Health: GET /api/health, GET / (index counts/endpoints)
- Auth: POST /api/auth/login {email,password}→{token,user}, POST /api/auth/logout, GET /api/auth/me
- Catalogue (public): GET /catalogue/categories|branding|fabrics|stages, GET /products[?category=&search=], GET /products/:id, GET /reference, GET /whatsapp/cta (configured:false until WHATSAPP_NUMBER)
- RFQ: POST /rfqs {customerId?,items|lines?,note?} (MOQ validateItems), GET /rfqs[?status=&customerId=], GET /rfqs/:id, PATCH /rfqs/:id, PATCH /rfqs/:id/status, POST /rfqs/:id/convert→order
- Orders: POST /orders, GET /orders, GET /orders/:id (withProgress), PATCH /orders/:id/stage {stage}, PATCH /orders/:id/status
- Leads: POST /leads (public intake), GET /leads, GET /leads/:id, PATCH /leads/:id
- Customers: GET /customers (admin), GET /customers/me (customer-only), GET /customers/:id. /me returns {user,company,dashboard}
- Samples: POST /samples (auth), GET /samples, GET /samples/:id, PATCH /samples/:id/status (admin)
- Admin: GET /admin/dashboard {kpis,funnels,production,attention,recentActivity}, GET /admin/events[?type=&limit=]
- Authz: collections need Bearer; scopeToUser 403 on foreign RFQ; /customers/me 403 for admin.
- Statuses: RFQ draft/submitted/in_review/quoted/accepted/rejected/converted; ORDER pending/in_production/on_hold/completed/cancelled; LEAD new/contacted/qualified/won/lost (sources whatsapp/website_form/configurator/email/phone); SAMPLE requested/approved/in_production/shipped/delivered/rejected. Stages from catalogue.meta.productionStages.
- Events: lead.created/updated, rfq.created/status_changed/quoted/converted, order.created/stage_changed, sample.requested/status_changed, auth.login.

## 5. Frontend routes (hash, no react-router)
- `#/` SiteApp (marketing default). `#/login` Login (admin→#/admin, customer→#/app).
- Customer: `#/app` dash, `#/app/catalogue`, `#/app/rfq-new`, `#/app/rfqs`, `#/app/orders`, `#/app/samples`.
- Admin: `#/admin` dash, `#/admin/leads`, `#/admin/rfqs`, `#/admin/orders`, `#/admin/samples`.
- Token sessionStorage `cw_token`. Logged-out deep link → Login with next preserved.
- api.js: BASE=VITE_API_BASE||'', Auth/Catalogue/Rfqs/Orders/Leads/Samples/Dashboard/WhatsApp/Reference. ui.jsx: useHashRoute/navigate/useAsync/Badge/StageTimeline/Loading/ErrorBox.

## 6. Known bugs / mismatches (ask before fixing)
1. Catalogue.jsx missing `import {useState}` → portal catalogue crashes. Landing unaffected.
2. RFQ shape: backend `items[]`, frontend NewRfq/tables/admin use `lines` → RfqTable shows 0, admin lines empty.
3. Order shape: backend `stage`+stages(), frontend OrderTable expects `productionStage/allStages` → timeline missing on customer orders.
4. API.md auth column says public for all — wrong; collections need Bearer (smoke asserts 401).
5. server.mjs doesn't load .env.local; export PORT in shell.
6. SEO: only <title>, no meta/OG/JSON-LD/robots/sitemap; hash router invisible to crawlers; site.jsx client-rendered.
7. No DB: restart wipes sessions+mutations unless PERSIST=1; last-write-wins; sessions Map lost on restart.
8. No upload (256KB JSON only), no AI/Redis/Postgres/Docker, tests only smoke.mjs.

## 7. Data + env
- Product: {id,name,category,fabric,gsm,leadTimeDays,moq,indicativePrice,colors[],branding[],sizes[]}
- User: {id,email,password scrypt$…,role,customerId?}. Logins: admin@customwear.sample/admin123, buyer@greenfield.sample/buyer123 (c-1001), admin@cedargrove.sample/buyer123 (c-1005).
- RFQ {id,customerId,status,items[],quotedTotal?,createdAt}; order {id,rfqId?,customerId,stage,status,qty?,dueDate?}; lead {id,contactName|name,email,phone,source,status}; sample {id,customerId,productId,status}.
- Env: PORT(4300|4399), HOST(0.0.0.0), DATA_DIR(./data), PERSIST=1→data/runtime.json, EVENTS_WEBHOOK_URL(unset), WHATSAPP_NUMBER(unset), VITE_API_BASE(''), VITE_API_PROXY(127.0.0.1:4399), SMOKE_PORT(4311).

## 8. Past decisions (context)
- Removed tiruppur-apparel from VS Code recents (folder empty). Fixed WiFi via --host 0.0.0.0 + HOST 0.0.0.0. Added npm run dev/install:all, RUNBOOK, start-dev.ps1, .gitignore diag/log/dist. Cleaned diag-*, *.pid, api-table.tmp, frontend/dist.
- Agreed: backend required for B2B; Postgres before launch (store.mjs is seam); Redis only at scale; managed free (Vercel+Render+Neon) to launch, VPS+Docker later; AI/n8n/CRM/SEO plan (emit ready, no secret/retry; SEO weak due to hash); Equinox mapping; pre-vibe checklist given.

## 9. Continue in new chat (copy-paste)
> I have customwear-platform at C:\Users\SURENDHAR\.cline\data\workspaces\chat\customwear-platform\. Read PROJECT_OVERVIEW.md first, then src/routes.mjs + src/store.mjs + frontend/src/App.jsx. Backend :4399 (PORT env), frontend :5174. Don't change stack (Node20+React18+Vite5) or API contract without asking. Run npm run smoke after backend changes. Known bugs §6 — ask before fixing. My next task: [PASTE TASK].
