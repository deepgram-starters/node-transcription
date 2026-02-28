# node-transcription

Node.js demo app for Deepgram Transcription.

## Architecture

- **Backend:** Node.js (JavaScript) on port 8081
- **Frontend:** Vite + vanilla JS on port 8080 (git submodule: `transcription-html`)
- **API type:** REST — `POST /api/transcription`
- **Deepgram API:** Pre-recorded Speech-to-Text (`/v1/listen`)
- **Auth:** JWT session tokens via `/api/session` (WebSocket auth uses `access_token.<jwt>` subprotocol)

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Main backend — API endpoints and request handlers |
| `deepgram.toml` | Metadata, lifecycle commands, tags |
| `Makefile` | Standardized build/run targets |
| `sample.env` | Environment variable template |
| `frontend/main.js` | Frontend logic — UI controls, API calls, result rendering |
| `frontend/index.html` | HTML structure and UI layout |
| `deploy/Dockerfile` | Production container (Caddy + backend) |
| `deploy/Caddyfile` | Reverse proxy, rate limiting, static serving |

## Quick Start

```bash
# Initialize (clone submodules + install deps)
make init

# Set up environment
test -f .env || cp sample.env .env  # then set DEEPGRAM_API_KEY

# Start both servers
make start
# Backend: http://localhost:8081
# Frontend: http://localhost:8080
```

## Start / Stop

**Start (recommended):**
```bash
make start
```

**Start separately:**
```bash
# Terminal 1 — Backend
node server.js

# Terminal 2 — Frontend
cd frontend && corepack pnpm run dev -- --port 8080 --no-open
```

**Stop all:**
```bash
lsof -ti:8080,8081 | xargs kill -9 2>/dev/null
```

**Clean rebuild:**
```bash
rm -rf node_modules frontend/node_modules frontend/.vite
make init
```

## Dependencies

- **Backend:** `package.json` — Uses `corepack pnpm` — Node's built-in package manager version pinning.
- **Frontend:** `frontend/package.json` — Vite dev server
- **Submodules:** `frontend/` (transcription-html), `contracts/` (starter-contracts)

Install: `corepack pnpm install`
Frontend: `cd frontend && corepack pnpm install`

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/session` | GET | None | Issue JWT session token |
| `/api/metadata` | GET | None | Return app metadata (useCase, framework, language) |
| `/api/transcription` | POST | JWT | Transcribes audio files or URLs using Deepgram's pre-recorded API. |

## Customization Guide

### Changing the Default Model
In the backend, find the `DEFAULT_MODEL` or `model` variable (typically near the top of the file or in the transcription handler). Change it to any supported model:
- `nova-3` (default, best accuracy)
- `nova-2` (previous generation)
- `base` (fastest, lower accuracy)

The frontend also has a model dropdown — update `frontend/main.js` if you want to change the default selection there.

### Adding Deepgram Features
The transcription API accepts many options. Add them to the options object passed to the SDK or API call:

| Feature | Parameter | Example Value | Effect |
|---------|-----------|---------------|--------|
| Language | `language` | `"es"`, `"fr"` | Transcribe non-English audio |
| Diarization | `diarize` | `true` | Identify different speakers |
| Punctuation | `punctuate` | `true` | Add punctuation to transcript |
| Smart Format | `smart_format` | `true` | Format numbers, dates, etc. |
| Paragraphs | `paragraphs` | `true` | Add paragraph breaks |
| Utterances | `utterances` | `true` | Split by speaker turns |
| Keywords | `keywords` | `["deepgram"]` | Boost specific terms |
| Redaction | `redact` | `["pci", "ssn"]` | Redact sensitive data |
| Summarize | `summarize` | `"v2"` | Add a summary |
| Topics | `topics` | `true` | Detect topics |
| Sentiment | `detect_topics` | `true` | Detect sentiment |

**Backend change:** Add parameters to the SDK call options object or API query string.

**Frontend change (optional):** Add UI controls (checkboxes, dropdowns) in `frontend/main.js` and pass them as form data or query parameters.

### Changing Input Modes
The app supports two input modes:
1. **File upload** — User uploads an audio file
2. **URL** — User provides a URL to an audio file

To add a new pre-defined URL, edit `frontend/index.html` and add a radio button option.

### Modifying the Response Format
The `formatTranscriptionResponse()` function in the backend shapes what the frontend receives. You can include extra fields from Deepgram's response (words with timestamps, confidence scores, speaker labels, etc.).

## Frontend Changes

The frontend is a git submodule from `deepgram-starters/transcription-html`. To modify:

1. **Edit files in `frontend/`** — this is the working copy
2. **Test locally** — changes reflect immediately via Vite HMR
3. **Commit in the submodule:** `cd frontend && git add . && git commit -m "feat: description"`
4. **Push the frontend repo:** `cd frontend && git push origin main`
5. **Update the submodule ref:** `cd .. && git add frontend && git commit -m "chore(deps): update frontend submodule"`

**IMPORTANT:** Always edit `frontend/` inside THIS starter directory. The standalone `transcription-html/` directory at the monorepo root is a separate checkout.

### Adding a UI Control for a New Feature
1. Add the HTML element in `frontend/index.html` (input, checkbox, dropdown, etc.)
2. Read the value in `frontend/main.js` when making the API call or opening the WebSocket
3. Pass it as a query parameter or request body field
4. Handle it in the backend `server.js` — read the param and pass it to the Deepgram API

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DEEPGRAM_API_KEY` | Yes | — | Deepgram API key |
| `PORT` | No | `8081` | Backend server port |
| `HOST` | No | `0.0.0.0` | Backend bind address |
| `SESSION_SECRET` | No | — | JWT signing secret (production) |

## Conventional Commits

All commits must follow conventional commits format. Never include `Co-Authored-By` lines for Claude.

```
feat(node-transcription): add diarization support
fix(node-transcription): resolve WebSocket close handling
refactor(node-transcription): simplify session endpoint
chore(deps): update frontend submodule
```

## Testing

```bash
# Run conformance tests (requires app to be running)
make test

# Manual endpoint check
curl -sf http://localhost:8081/api/metadata | python3 -m json.tool
curl -sf http://localhost:8081/api/session | python3 -m json.tool
```
