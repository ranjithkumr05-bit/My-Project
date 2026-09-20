# Customwear Platform - Runbook & Troubleshooting

## Quick Start (Permanent Fix)

### One-Command Start (Recommended)
```powershell
cd customwear-platform
npm run dev
```
This starts both backend and frontend with proper WiFi binding using `concurrently`.

### Install All Dependencies (If node_modules missing)
```powershell
cd customwear-platform
npm run install:all
```

## Starting the Servers Manually

### Backend (API)
```powershell
cd customwear-platform
set PORT=4399 && node server.mjs
# or: npm run dev:backend   (reads .env.local via your shell setup)
```
- Port: **4399** (set in `.env.local` — `server.mjs` only reads `process.env.PORT`, so load `.env.local` into the shell or pass `PORT` explicitly)
- Binding: `0.0.0.0` (accessible on WiFi/network)

### Frontend (Vite)
```powershell
cd customwear-platform/frontend
npx vite --host 0.0.0.0 --port 5174
```
- Port: **5174**
- **Important**: Use `--host 0.0.0.0` to bind to all network interfaces for WiFi access

## URLs

| Service | Local | WiFi/Network |
|---------|-------|--------------|
| Frontend | http://localhost:5174 | http://192.168.1.8:5174 |
| Backend API | http://localhost:4399 | http://192.168.1.8:4399 |

## Common Issues & Fixes

### Issue: Servers not loading / crashing
**Symptoms**: Backend or frontend fails to start, connection refused errors

**Fix**:
1. Ensure `node_modules` exists in `customwear-platform/` and `customwear-platform/frontend/`
   ```powershell
   cd customwear-platform
   npm run install:all
   ```
2. Restart both servers

### Issue: Not accessible over WiFi/network
**Symptoms**: Can access via `localhost` but not via `192.168.1.x`

**Fix**: Start servers with `--host 0.0.0.0` flag:
- Vite: `npx vite --host 0.0.0.0 --port 5174`
- Backend already binds to `0.0.0.0` by default in `server.mjs`

### Issue: Wrong port
**Symptoms**: Server running on different port than expected

**Check**: Look at `.env.local` for `PORT=` setting, or check server startup logs

## Permanent Fixes Applied

### 1. npm run dev (concurrently)
Both servers now start with a single command:
```powershell
npm run dev
```
Uses `concurrently` package to run backend and frontend together.

### 2. Auto-install Dependencies
```powershell
npm run install:all
```
Ensures both backend and frontend `node_modules` are installed.

### 3. WiFi Binding Built-in
All dev scripts now include `--host 0.0.0.0` for network access.

## Verification Commands

```powershell
# Check if servers are running
netstat -ano | Select-String '4399|5174' | Select-String 'LISTENING'

# Test backend
Invoke-WebRequest -Uri 'http://localhost:4399/' -UseBasicParsing

# Test frontend
Invoke-WebRequest -Uri 'http://localhost:5174/' -UseBasicParsing
```

## Project Structure

```
customwear-platform/
├── server.mjs          # Backend API server
├── src/                # Backend source code
├── frontend/           # Vite React frontend
│   └── src/
│   └── package.json    # Frontend dependencies
├── data/               # Sample data
├── package.json        # Backend dependencies + dev scripts
├── start-dev.ps1       # PowerShell startup script
└── RUNBOOK.md          # This file
```

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend + frontend (recommended) |
| `npm run dev:backend` | Start only backend |
| `npm run dev:frontend` | Start only frontend |
| `npm run install:all` | Install all dependencies (both projects) |
| `npm start` | Start backend only (no watch mode) |
| `npm run smoke` | Run smoke tests |

## Notes

- The `tiruppur-apparel` folder may be empty - it's a separate project
- Backend runs on port **4399** (from `.env.local` — must be in shell env, `server.mjs` does not auto-load `.env.local`)
- Frontend runs on port 5174 with `--host 0.0.0.0` baked into `frontend/package.json` → `npm run dev` is WiFi-ready
- Both need to bind to `0.0.0.0` for network/WiFi access
- `concurrently` is now a devDependency for running both servers together
