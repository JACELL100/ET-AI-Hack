# RAKSHA AI

> AI-Powered Digital Public Safety Intelligence Platform

Built for the **ET AI Hackathon 2.0** (Economic Times × Unstop) — tackling India's rising cybercrime epidemic through proactive, multi-domain AI intelligence.

---

## The Problem

India recorded **1.14 million cybercrime complaints in 2023** — a 60% jump from 2022. The situation has only worsened:

- **Digital arrest scams** — fraudsters impersonating CBI, ED, or Customs officers trap victims in multi-day video-call hostage situations. MHA reported over **₹1,776 crore** defrauded in just the first nine months of 2024.
- **Counterfeit currency** — RBI's 2025 Annual Report flagged record FICN (Fake Indian Currency Notes) seizures. High-denomination ₹500 fakes are now quality-printed enough to defeat manual inspection at bank counters.
- **Fraud networks** — these are not opportunistic crimes. They are industrialised operations run from cross-border fraud compounds using spoofed numbers, AI-generated voices, and fake government portals.

What law enforcement lacks is **intelligence before mass victimisation**, not evidence after the fact.

RAKSHA AI addresses this by converging financial transaction intelligence, communication network analysis, physical currency security, and real-time geospatial coordination — all in one command-centre platform.

---

## Solution: Five Modules, One Platform

```
┌──────────────────────────────────────────────────────────────────────┐
│                        RAKSHA AI PLATFORM                            │
│                                                                      │
│  SENTINEL  │  NETRA   │    JAAL    │  DRISHTI   │  KAVACH           │
│  (Scam)    │ (Currency)│ (Network) │  (Geo)     │  (Citizen)        │
│            │           │           │            │                    │
│                 Unified Dashboard (Command Centre)                   │
│                 Real-time WebSocket Alert Feed                       │
└──────────────────────────────────────────────────────────────────────┘
```

| Module | Code Name | What it does |
|---|---|---|
| Digital Arrest Scam Detector | **SENTINEL** | Scores call transcripts and messages against scam pattern libraries; checks phone numbers against a risk database; surfaces active scam alerts in real time |
| Counterfeit Currency Identifier | **NETRA** | Analyses currency note images for microprint, security thread, watermark, colour-shift ink, and 10 other security features; returns a AUTHENTIC / SUSPICIOUS / COUNTERFEIT verdict with per-feature breakdown |
| Fraud Network Graph Intelligence | **JAAL** | Maps accounts, phone numbers, and persons into a directed risk graph; detects fraud ring communities with risk scores; exposes graph data ready for a force-directed visualisation |
| Geospatial Crime Intelligence | **DRISHTI** | Returns geotagged hotspot incidents and heatmap weights for live crime map overlays; covers scam, counterfeit, and network threat types by district |
| Citizen Fraud Shield | **KAVACH** | Rule-based conversational AI that classifies user messages into scam/currency/emergency intents, provides instant safety guidance and the 1930 helpline, and checks phone numbers for risk |
| Unified Dashboard | _(core)_ | Aggregates live stats (active alerts, scams today, counterfeits found, citizens protected) and a cross-module alert feed with severity classification |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (Next.js 15, React 19, TypeScript)                             │
│                                                                         │
│  Landing Page → Dashboard → SENTINEL / NETRA / JAAL / DRISHTI / KAVACH │
│                                                                         │
│  HTTP (axios)  ─────────────────────────────────────────────────────┐  │
│  WebSocket (socket.io-client) ──────────────────────────────────┐   │  │
└──────────────────────────────────────────────────────────────────┼───┼──┘
         Next.js dev proxy rewrites /api/* and /ws/*               │   │
         to localhost:8000 (no CORS needed in dev)                 │   │
                                                                   ▼   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  FastAPI 0.115 (Uvicorn ASGI, Python 3.11+)                              │
│                                                                          │
│  GET  /health                                                            │
│  GET  /api/v1/dashboard/stats       GET  /api/v1/dashboard/alerts        │
│  POST /api/v1/sentinel/analyse/text GET  /api/v1/sentinel/number/{phone} │
│  GET  /api/v1/sentinel/alerts                                            │
│  GET  /api/v1/netra/scan            GET  /api/v1/netra/stats             │
│  GET  /api/v1/jaal/communities      GET  /api/v1/jaal/graph/{cluster_id} │
│  GET  /api/v1/drishti/hotspots      GET  /api/v1/drishti/heatmap         │
│  POST /api/v1/kavach/chat           POST /api/v1/kavach/check/number     │
│  WS   /ws/{module}                                                       │
│                                                                          │
│  Services layer (business logic per module)                              │
│  Pydantic v2 schemas — single ApiResponse envelope for every endpoint   │
│  WebSocket ConnectionManager — per-channel broadcast registry            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Live intelligence upgrades

SENTINEL accepts authorised, signed telecom, video-integrity and payment-risk
metadata at `POST /api/v1/sentinel/ingest/live`. It fuses caller-ID attestation,
spoofing and velocity signals, deepfake/virtual-camera metadata, payment mule
risk and transcript analysis into an explainable result. High-confidence events
create an alert plus separately reviewable JAAL and DRISHTI leads, and are
recorded in a privacy-minimised SHA-256 hash chain signed with Ed25519. DRISHTI
also accepts signed, deduplicated NCRP/NCRB/State Police/bank/FIU/telecom feed
contracts, and JAAL preserves evidence packages in durable SQLite storage with
independent package-and-ledger verification.

See the [architecture](docs/ARCHITECTURE.md), [partner-integration guide](docs/LIVE_INTELLIGENCE_INTEGRATION.md),
[evaluation protocol](docs/EVALUATION_PROTOCOL.md), and the NETRA training-data
contract at [backend/app/data/netra_datasets/README.md](backend/app/data/netra_datasets/README.md).

### API Response Envelope

Every endpoint returns the same shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {}
}
```

This lets the frontend handle all responses uniformly without per-endpoint error parsing.

### WebSocket

Connect to `/ws/{module}` (e.g. `/ws/sentinel`). On connect the server sends:

```json
{ "event": "connected", "module": "sentinel" }
```

Incoming JSON messages are echoed back as a broadcast to all subscribers on the same channel — ready for real-time alert pushes once the AI pipeline is wired in.

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| Next.js | 15.3.3 | App Router, Turbopack dev server |
| React | 19 | UI rendering |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Utility-first styling |
| Framer Motion | 12 | Animations and page transitions |
| Recharts | 2.15 | Charts and data visualisation |
| Radix UI | various | Accessible headless primitives (Dialog, Tabs, Tooltip, Dropdown, Switch) |
| socket.io-client | 4.8 | WebSocket real-time connection |
| Lucide React | 0.475 | Icon set |
| axios | 1.7 | HTTP client |
| next-themes | 0.4 | Dark/light theme switching |
| clsx + tailwind-merge | — | Conditional class merging |

### Backend

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.6 | Async REST + WebSocket API framework |
| Uvicorn | 0.34.0 | ASGI server (with standard extras) |
| Pydantic | 2.11.4 | Data validation and serialisation |
| pydantic-settings | 2.9.1 | Config from `.env` files |
| python-multipart | 0.0.20 | Form/file upload parsing |

---

## Project Structure

```
ET_AI_Hack/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing / hero page
│   │   │   ├── layout.tsx            # Root layout (theme provider, fonts)
│   │   │   ├── globals.css           # Global CSS variables and base styles
│   │   │   ├── dashboard/            # Unified command centre page
│   │   │   ├── sentinel/             # Digital arrest scam detector
│   │   │   ├── netra/                # Counterfeit currency scanner
│   │   │   ├── jaal/                 # Fraud network graph
│   │   │   ├── drishti/              # Geospatial crime map
│   │   │   ├── kavach/               # Citizen fraud shield chatbot
│   │   │   └── (auth)/               # Auth routes (grouped, no layout segment)
│   │   ├── components/
│   │   │   ├── home/                 # Landing page sections
│   │   │   ├── layout/               # Navbar, sidebar, app shell
│   │   │   ├── ui/                   # WireSphere, ThreatGauge, and other primitives
│   │   │   └── providers/            # ThemeProvider, context wrappers
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/                      # axios API client, utility functions
│   │   └── types/                    # TypeScript type definitions
│   ├── next.config.ts                # Dev proxy rewrites, image config
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app factory, CORS, router wiring, WS hub
│   │   ├── config.py                 # pydantic-settings config (reads .env)
│   │   ├── models/
│   │   │   └── schemas.py            # All Pydantic schemas + ApiResponse envelope
│   │   ├── routes/
│   │   │   ├── dashboard.py          # /api/v1/dashboard/*
│   │   │   ├── sentinel.py           # /api/v1/sentinel/*
│   │   │   ├── netra.py              # /api/v1/netra/*
│   │   │   ├── jaal.py               # /api/v1/jaal/*
│   │   │   ├── drishti.py            # /api/v1/drishti/*
│   │   │   └── kavach.py             # /api/v1/kavach/*
│   │   ├── services/
│   │   │   ├── dashboard_service.py  # Aggregated stats and cross-module alert feed
│   │   │   ├── sentinel_service.py   # Keyword-based scam scoring + number risk
│   │   │   ├── netra_service.py      # Feature-based currency verdict
│   │   │   ├── jaal_service.py       # Pre-seeded fraud graph + community data
│   │   │   ├── drishti_service.py    # Pre-seeded incident hotspots
│   │   │   └── kavach_service.py     # Intent detection + guided responses
│   │   └── websockets/
│   │       └── manager.py            # Async per-channel broadcast manager
│   ├── run.py                        # Entry point: python run.py
│   ├── requirements.txt
│   ├── .env.example                  # Template — safe to commit
│   └── .env                          # Local secrets — gitignored
│
├── context/                          # Competition brief and planning docs
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18 — [nodejs.org](https://nodejs.org)
- **Python** >= 3.11 — [python.org](https://python.org)
- **npm** (bundled with Node)
- **Git**

---

### 1. Clone

```bash
git clone https://github.com/<your-username>/ET_AI_Hack.git
cd ET_AI_Hack
```

---

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux
```

The default `.env` values work out of the box for local development — no changes needed.

**Start the backend:**

```bash
python run.py
```

or directly:

```bash
uvicorn app.main:app --reload --port 8000
```

- API base: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Start the frontend:**

```bash
npm run dev
```

- App: `http://localhost:3000`

During `npm run dev`, Next.js proxies `/api/*` and `/ws/*` to `localhost:8000` automatically — no CORS configuration needed.

### Chrome extension

The deployable Manifest V3 companion lives in [`chrome-extension/`](./chrome-extension/). It provides module shortcuts and optional voice control for the configured RAKSHA portal. See its [deployment guide](./chrome-extension/README.md) to load it locally or generate the Chrome Web Store upload ZIP.

---

### 4. Verify everything is running

```bash
# Backend health check
curl http://localhost:8000/health
# → {"success":true,"data":{"status":"ok","service":"raksha-ai-api"},...}

# Dashboard stats
curl http://localhost:8000/api/v1/dashboard/stats

# Test SENTINEL text analysis
curl -X POST http://localhost:8000/api/v1/sentinel/analyse/text \
  -H "Content-Type: application/json" \
  -d '{"text": "This is CBI. Your account has been frozen due to money laundering."}'
```

---

## API Reference

All endpoints return the standard `ApiResponse` envelope:

```json
{ "success": true, "data": <payload>, "error": null, "meta": {} }
```

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

### Dashboard

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/dashboard/stats` | — | Active alerts, scams today, counterfeits found, citizens protected |
| GET | `/api/v1/dashboard/alerts` | `?limit=20` (max 100) | Recent cross-module alert feed with severity and score |

### SENTINEL — Scam Detection

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/sentinel/analyse/text` | `{"text": "..."}` | Scores text against 20+ scam intent keywords; returns `threat_score`, `verdict` (SCAM/SUSPICIOUS/SAFE), matched `intents`, and `confidence` |
| GET | `/api/v1/sentinel/number/{phone}` | path: `phone` | Returns `risk_score` (0–100) and `reports` count for a given number |
| GET | `/api/v1/sentinel/alerts` | — | List of active high-severity SENTINEL alerts |

Example response for `/sentinel/analyse/text`:
```json
{
  "success": true,
  "data": {
    "threat_score": 74.0,
    "verdict": "SCAM",
    "intents": ["ARREST", "CBI", "MONEY LAUNDERING", "ACCOUNT"],
    "confidence": 0.84
  }
}
```

### NETRA — Currency Verification

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/netra/scan` | `?seed=note` | Returns AUTHENTIC/SUSPICIOUS/COUNTERFEIT verdict with 10-feature security checklist |
| GET | `/api/v1/netra/stats` | — | Cumulative scan counts and detection breakdown |

Security features checked: Security Thread, Watermark, Latent Image, Micro Lettering, Intaglio Print, Colour-shift Ink, See-through Register, Serial Number, Bleed Lines, Denomination Numeral.

### JAAL — Fraud Network

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/jaal/communities` | — | List of detected fraud ring communities with node count and risk score |
| GET | `/api/v1/jaal/graph/{cluster_id}` | path: `cluster_id` | Full graph (nodes + directed edges) for a specific cluster — ready for D3/Recharts force layout |

Node types: `person`, `mule`, `hub`, `phone`, `account`. Edge types: `OWNS`, `CALLED`, `ASSOCIATED_WITH`, `TRANSFERRED_TO`.

### DRISHTI — Geospatial Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/drishti/hotspots` | Incident points with lat/lng, intensity (0–1), type (scam/counterfeit/network), and district |
| GET | `/api/v1/drishti/heatmap` | Simplified lat/lng/weight array for map heatmap overlays |

### KAVACH — Citizen Shield

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/kavach/chat` | `{"message": "...", "sessionId": "..."}` | Detects intent (emergency/report_scam/check_number/currency/greeting), returns safety guidance, `riskLevel`, and `quickActions` |
| POST | `/api/v1/kavach/check/number` | `{"phone": "..."}` | Fast risk flag for a phone number (`safe: bool`, `risk_score`) |

Detected intents: `emergency`, `report_scam`, `check_number`, `currency`, `greeting`, `fallback`.  
Emergency responses always include the **1930 Cyber Crime Helpline**.

### WebSocket

```
ws://localhost:8000/ws/{module}
```

Available channels: `sentinel`, `netra`, `jaal`, `drishti`, `kavach`, `dashboard`.

On connect:
```json
{ "event": "connected", "module": "sentinel" }
```

Send a JSON payload; it is broadcast to all subscribers on the same channel:
```json
{ "event": "message", "module": "sentinel", "payload": { ... } }
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `FASTAPI_DEBUG` | `true` | Enable debug mode and detailed error responses |
| `FASTAPI_SECRET_KEY` | `dev-secret-change-me` | App secret key — **must be changed in production** |
| `BACKEND_HOST` | `0.0.0.0` | Interface to bind |
| `BACKEND_PORT` | `8000` | Port to listen on |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed CORS origins |
| `FRONTEND_DEV_URL` | `http://localhost:3000` | Frontend origin (informational) |

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL, e.g. `http://localhost:8000` |

---

## Data Models (Key Schemas)

```typescript
// Every API response
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta: Record<string, unknown>;
}

// Dashboard
interface DashboardStats {
  activeAlerts: number;
  scamsDetectedToday: number;
  counterfeitFound: number;
  citizensProtected: number;
}

// SENTINEL result
interface SentinelAnalysisResult {
  threat_score: number;      // 0–100
  verdict: "SCAM" | "SUSPICIOUS" | "SAFE";
  intents: string[];
  confidence: number;        // 0–1
}

// NETRA result
interface NetraScanResult {
  verdict: "AUTHENTIC" | "SUSPICIOUS" | "COUNTERFEIT";
  confidence: number;
  features: Array<{ name: string; status: "pass" | "fail" | "warn" }>;
  denomination: string;
}

// JAAL graph
interface GraphNode { id: string; label: string; type: string; riskScore: number; }
interface GraphEdge { id: string; source: string; target: string; type: string; weight: number; }

// DRISHTI
interface HotspotData { id: string; lat: number; lng: number; intensity: number; type: string; district: string; }

// KAVACH
interface KavachChatResponse {
  reply: string;
  intents: string[];
  quickActions: string[];
  riskLevel: "danger" | "warning" | "safe";
}
```

---

## Running in Production

The project includes development baselines and production-gated integration
paths. For a production deployment:

1. Supply authorised, representative training/evaluation data and register only
   validated models. NETRA deliberately refuses a verdict without one.
2. Set `FASTAPI_DEBUG=false` and generate a strong `FASTAPI_SECRET_KEY`.
3. Update `CORS_ORIGINS` to your production frontend domain.
4. Run with multiple Uvicorn workers behind a reverse proxy (e.g. Nginx or an ALB):

```bash
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

5. Build and serve the Next.js frontend:

```bash
cd frontend
npm run build
npm run start
```

---

## Roadmap — From Prototype to Production AI

| Module | Prototype (current) | Production AI target |
|---|---|---|
| SENTINEL | Signed telecom/video/payment metadata fusion plus content classification | IndicBERT / Faster-Whisper fine-tuned on authorised scam corpora; source-specific number reputation feeds |
| NETRA | Transparent, manifest-trained baseline registry with hold-out gates; no model ships until authorised FICN data is supplied | Vetted CNN/feature-localisation model trained and benchmarked on RBI/agency-verified FICN data |
| JAAL | Seed graph plus live module/agency signal ingestion; persistent signed evidence packages | Graph Neural Network (GraphSAGE) on live transaction + call metadata; FIU-IND integration |
| DRISHTI | Historical development baseline plus signed NCRP/NCRB/state/bank/FIU/telecom ingest | Approved production feeds, clustering and patrol optimisation model |
| KAVACH | Rule-based intent matching | Rasa NLU or LLM-backed agent; 12-language support via IndicTrans2 |
| WebSocket | In-process broadcast registry | Redis pub/sub backed; connect to live AI inference pipeline events |

---

## Problem Statement

> Build an AI-powered Digital Public Safety Intelligence platform that equips law enforcement agencies, financial institutions, and citizens with proactive tools to detect, disrupt, and respond to digital fraud networks, counterfeit currency circulation, and organised scam operations — shifting from **reactive case investigation to predictive threat neutralisation**.

Theme: **Smart Cities / Public Safety / Digital Trust / Geospatial Law Enforcement**

---

## Hackathon

**ET AI Hackathon 2.0** — Economic Times × Unstop  
Phase 2: Build Sprint | Prize pool: ₹10,00,000

| Prize | Amount |
|---|---|
| Winner | ₹5,00,000 |
| 1st Runner-Up | ₹3,00,000 |
| 2nd Runner-Up | ₹2,00,000 |

Evaluation criteria: detection accuracy, precision/recall, false positive rate, lead time before victimisation, and auditability of intelligence packages for legal admissibility.

---

## License

Built for a hackathon and intended for demonstration purposes. Not for production deployment without replacing mock service logic with validated AI models and appropriate data governance.
