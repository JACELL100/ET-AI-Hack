# 🛡️ RAKSHA AI — Frontend & Backend Implementation Plan

> **Design Inspiration:** CY·FOCUS Cybersecurity Platform
> **Color Palette:** Dark Charcoal + Bold Orange-Red Accents + Wire-mesh Graphics
> **Stack:** Next.js 15.3 (App Router) + FastAPI 0.115 + Uvicorn

---

## 📐 Design System

### Color Tokens
```
--color-accent:       #E63A1E   (bold orange-red — primary CTA, highlights)
--color-accent-dark:  #B02D16   (hover state)
--color-accent-glow:  rgba(230,58,30,0.15)  (glow effects)

DARK MODE:
--bg-primary:         #111111   (deepest bg)
--bg-secondary:       #1A1A1A   (cards, panels)
--bg-tertiary:        #222222   (elevated elements)
--bg-border:          #2E2E2E   (dividers, card borders)
--text-primary:       #F0F0F0
--text-secondary:     #888888
--text-muted:         #555555

LIGHT MODE:
--bg-primary:         #F5F4F0   (warm off-white)
--bg-secondary:       #FFFFFF
--bg-tertiary:        #EBEBEB
--bg-border:          #DEDEDE
--text-primary:       #111111
--text-secondary:     #555555
--text-muted:         #888888
```

### Typography
```
Font Stack:
- Display (headings):  "Playfair Display", Georgia, serif   → large impact headlines
- Body:                "Inter", system-ui, sans-serif        → readable UI text
- Mono:                "JetBrains Mono", monospace           → code snippets overlay

Scale:
- Hero:     clamp(2.5rem, 6vw, 5rem)   bold / 900
- H1:       clamp(2rem, 4vw, 3.5rem)   bold / 800
- H2:       clamp(1.5rem, 3vw, 2.5rem) semibold / 700
- H3:       1.25rem                     semibold / 600
- Body:     1rem / 1.125rem             regular / 400
- Small:    0.875rem                    regular
- Label:    0.75rem  uppercase tracking-widest / 500
```

### Motion System
```
- Fade-in:       opacity 0→1, 600ms ease-out
- Slide-up:      translateY(24px)→0, 600ms ease-out, staggered 100ms
- Scale hover:   scale(1.02), 200ms ease
- Glow pulse:    box-shadow pulse on accent color, 2s infinite
- Grid drift:    slow background-position animation on wire-mesh
- Card hover:    border-color → accent, 200ms
```

---

## 🗂️ Project Structure

```
raksha-ai/
├── frontend/                          # Next.js 15.3 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout (fonts, theme provider)
│   │   │   ├── page.tsx               # Home/Landing page
│   │   │   ├── globals.css            # CSS variables, reset, animations
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # LEO/Admin unified dashboard
│   │   │   ├── sentinel/
│   │   │   │   ├── page.tsx           # Scam detection hub
│   │   │   │   └── simulate/
│   │   │   │       └── page.tsx       # Call/video simulation
│   │   │   ├── netra/
│   │   │   │   └── page.tsx           # Currency scanner
│   │   │   ├── jaal/
│   │   │   │   └── page.tsx           # Fraud network explorer
│   │   │   ├── drishti/
│   │   │   │   └── page.tsx           # Geospatial command centre
│   │   │   ├── kavach/
│   │   │   │   └── page.tsx           # Citizen shield / chatbot
│   │   │   └── (auth)/
│   │   │       ├── login/page.tsx
│   │   │       └── register/page.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx         # Top nav with theme toggle
│   │   │   │   ├── Sidebar.tsx        # Dashboard sidebar
│   │   │   │   └── Footer.tsx
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.tsx    # Full-screen hero w/ wire mesh
│   │   │   │   ├── ModulesGrid.tsx    # 5 module cards
│   │   │   │   ├── ChallengesSection.tsx  # "Key Challenges" 3-col cards
│   │   │   │   ├── StatsSection.tsx   # Impact numbers marquee
│   │   │   │   └── ContactSection.tsx # CTA section
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx         # Primary/secondary/ghost variants
│   │   │   │   ├── Card.tsx           # Dark card with hover states
│   │   │   │   ├── Badge.tsx          # Status/severity badges
│   │   │   │   ├── ThreatGauge.tsx    # Radial threat score viz
│   │   │   │   ├── WireSphere.tsx     # Animated 3D wire mesh sphere (SVG)
│   │   │   │   ├── GridBackground.tsx  # Wire-mesh grid background
│   │   │   │   ├── CodeSnippet.tsx    # Dark code overlay card
│   │   │   │   └── ThemeToggle.tsx    # Sun/moon toggle
│   │   │   ├── sentinel/
│   │   │   │   ├── CallSimulator.tsx  # Phone call UI simulation
│   │   │   │   ├── TranscriptFeed.tsx # Live transcript with labels
│   │   │   │   └── ThreatDashboard.tsx
│   │   │   ├── netra/
│   │   │   │   ├── CurrencyScanner.tsx # Camera + drag-drop zone
│   │   │   │   └── FeatureReport.tsx   # Annotated result
│   │   │   ├── jaal/
│   │   │   │   └── GraphExplorer.tsx   # Network graph (React Flow)
│   │   │   ├── drishti/
│   │   │   │   └── CrimeMap.tsx        # Mapbox heatmap
│   │   │   └── kavach/
│   │   │       ├── ChatWidget.tsx      # Floating chat UI
│   │   │       └── WhatsAppSim.tsx     # WhatsApp-style interface
│   │   ├── lib/
│   │   │   ├── api.ts                  # Axios API client
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useAnalysis.ts
│   │   └── types/
│   │       └── index.ts
│   ├── public/
│   │   └── fonts/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   └── package.json
│
└── backend/                           # FastAPI Application
    ├── app/
    │   ├── main.py                    # FastAPI entry + CORS + routers
    │   ├── config.py                  # Settings (pydantic-settings)
    │   ├── routes/
    │   │   ├── __init__.py
    │   │   ├── sentinel.py
    │   │   ├── netra.py
    │   │   ├── jaal.py
    │   │   ├── drishti.py
    │   │   ├── kavach.py
    │   │   └── dashboard.py
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── schemas.py             # Pydantic v2 models
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── sentinel_service.py    # Mock AI analysis logic
    │   │   ├── netra_service.py
    │   │   ├── jaal_service.py
    │   │   ├── drishti_service.py
    │   │   └── kavach_service.py
    │   └── websockets/
    │       └── manager.py             # WebSocket connection manager
    └── requirements.txt
```

---

## 📄 Page-by-Page UI Breakdown

### 1. Home / Landing Page (`/`)
```
SECTIONS:
[1] Navbar
    - Logo: "RAKSHA AI" in bold + shield icon
    - Links: MODULES | RESOURCES | BLOG | COMPANY | CONTACT US ↗
    - Right: Theme toggle + Get Started button (orange)

[2] Hero Section (full viewport height)
    - Background: dark charcoal (#111) + animated wire-mesh grid overlay
    - Left: Large serif headline "AI-Powered Digital Safety. We Protect What Matters."
    - Sub: short description text (muted)
    - CTA: "GET A CONSULTATION" button (white with arrow)
    - Right: Floating code snippet card (dark, syntax highlighted)
    - Bottom-left: Decorative wire-mesh sphere (animated SVG)

[3] Stats Marquee
    - Horizontal scrolling strip: "1.14M COMPLAINTS · ₹1,776 CR DEFRAUDED · 60% YoY GROWTH"
    - Background: accent orange (#E63A1E), white text, infinite scroll

[4] Modules Overview (5 cards)
    - Section label: "OUR MODULES" (uppercase, small, muted)
    - Heading: "Five Specialized AI Agents Working in Concert"
    - Grid: 2+3 layout cards
    - Each card: module name, codename badge, 2-line description, wire sphere icon
    - Hover: border glows orange, sphere animates

[5] Key Challenges Section (3-column)
    - Label: "CASE STUDIES"
    - Heading: "Key Challenges We Solve." (large, white)
    - 3 cards: Undetected Vulnerabilities, Slow Response, Regulatory Gaps
    - Each: title, description, animated wire sphere (unique variant), CTA button
    - Middle card: orange/active state (orange bg, white text)

[6] How It Works Timeline
    - 4-step process with connecting line
    - Dark cards with numbered steps

[7] Impact Stats Grid (2x2)
    - Large numbers: "95% Detection Accuracy", "< 3s Response", etc.

[8] Contact / CTA Section
    - Split: left = "Let's Strengthen Security — Get in Touch"
    - Right: Simple form (name, email, role, message)
    - Background: accent orange

[9] Footer
    - Logo, nav links, copyright
```

### 2. Dashboard (`/dashboard`)
```
LAYOUT: Sidebar + Main content area

SIDEBAR:
- Logo at top
- Navigation: Dashboard, SENTINEL, NETRA, JAAL, DRISHTI, KAVACH, Settings
- Icons + labels, active state with orange left border

MAIN AREA:
[1] Stats Row (4 cards)
    - Active Alerts, Scams Detected Today, Counterfeits Found, Citizens Protected

[2] Live Alert Feed (left 60%)
    - Real-time scrolling list of alerts with severity badges
    - Orange = CRITICAL, Yellow = HIGH, Gray = LOW

[3] Threat Distribution Chart (right 40%)
    - Donut chart showing alert categories

[4] Recent Cases Table
    - Full-width table with case ID, type, status, assigned officer, date
    - Row hover: slight highlight
```

### 3. SENTINEL — Scam Detection (`/sentinel`)
```
[1] Header: "SENTINEL — Digital Arrest Scam Detection"
    Sub: threat score counter + active sessions

[2] Input Panel (left half)
    - Tab buttons: AUDIO | VIDEO | TEXT | CDR UPLOAD
    - Audio tab: mic button + waveform animation, OR file upload
    - Big "SIMULATE SCAM CALL" button (orange)

[3] Analysis Panel (right half)
    - Live transcript feed (dark card, monospace font)
    - Threat score radial gauge (0-100)
    - Detected intents timeline
    - Red flag chips: INTIMIDATION, URGENCY, IMPERSONATION

[4] Alert Generation (bottom)
    - Alert preview card + "SEND ALERT" CTA

SIMULATION PAGE:
- Left: Phone mockup UI (caller ID, timer, controls)
- Right: Real-time analysis with animated transcript
```

### 4. NETRA — Currency Scanner (`/netra`)
```
[1] Header + stats (scans today, counterfeits detected)

[2] Scanner (center, full-width)
    - Drag-drop zone OR camera button
    - Guided overlay for note placement
    - Step indicators: CAPTURE → PREPROCESS → ANALYSE → REPORT

[3] Results Card (below scanner, appears after analysis)
    - Verdict badge: AUTHENTIC (green) / SUSPICIOUS (yellow) / COUNTERFEIT (red)
    - Confidence percentage
    - Feature check list (10 security features with pass/fail icons)
    - Annotated image with bounding boxes

[4] History Table (bottom)
    - Previous scans with thumbnails
```

### 5. JAAL — Fraud Network (`/jaal`)
```
[1] Header + community count

[2] Full-screen graph canvas (React Flow)
    - Nodes: color-coded by type (person=orange, phone=blue, account=green)
    - Edges: animated dashes for recent connections
    - Controls: zoom, filter, time slider

[3] Node Detail Panel (right sidebar, appears on click)
    - Entity info, connections list, risk score, evidence refs

[4] Evidence Package Generator (bottom bar)
    - Select cluster → Generate Package button
```

### 6. DRISHTI — Geospatial (`/drishti`)
```
[1] Full-screen Mapbox map (dark style)
    - Heatmap layer overlay
    - Hotspot markers with orange circles
    - Patrol route lines

[2] Layer Controls (top-left floating panel)
    - Toggle: Heatmap | Hotspots | Patrol | Live Incidents

[3] Live Feed (right sidebar)
    - Real-time incident list with time, type, location

[4] Stats Panel (bottom)
    - District comparison mini-charts
```

### 7. KAVACH — Citizen Shield (`/kavach`)
```
[1] Header section with "Protection at Your Fingertips"

[2] Tab selector: WEB CHAT | WHATSAPP SIM | IVR SIM

[3] Web Chat (default tab)
    - Full chat interface with message history
    - Bot messages: dark card with avatar
    - User messages: orange bubble
    - Quick action chips at bottom

[4] WhatsApp Sim (tab 2)
    - Pixel-perfect WhatsApp UI (green header, white chat bg, bubbles)

[5] IVR Sim (tab 3)
    - Phone keypad graphic with audio prompts
```

---

## 🎨 Component Specifications

### WireSphere Component
```tsx
// Pure CSS/SVG animated wireframe sphere
// 3 variants: default (gray), active (orange glow), critical (red pulse)
// Uses CSS conic-gradient + rotation animation
// No external 3D library — lightweight SVG paths
```

### GridBackground Component
```tsx
// CSS-only animated grid/web mesh background
// background-image: radial-gradient + linear-gradient combo
// Subtle drift animation on background-position
// Applies to: hero section, CTA section
```

### ThreatGauge Component
```tsx
// SVG radial gauge 0-100
// Color: green (0-40), yellow (40-70), red (70-100)
// Animated fill when score changes
// Shows percentage + label in center
```

### Button Component
```tsx
variants:
  primary:   bg-accent text-white hover:bg-accent-dark
  secondary: border border-accent text-accent hover:bg-accent/10
  ghost:     text-secondary hover:text-primary
  danger:    bg-red-600 text-white

sizes: sm | md | lg
with icon (right arrow ↗ on primary)
```

---

## 🔌 Backend API Plan (FastAPI)

### main.py
```python
- FastAPI app with title "RAKSHA AI API"
- CORS middleware allowing frontend origin
- Include all routers with /api/v1 prefix
- WebSocket endpoint at /ws/{module}
- Health check at /health
```

### Endpoints Summary
```
GET  /health                          → system health
GET  /api/v1/dashboard/stats          → { alerts, scams, counterfeits, citizens }
GET  /api/v1/dashboard/alerts         → list of recent alerts

POST /api/v1/sentinel/analyse/text    → { text } → { threat_score, intents, verdict }
POST /api/v1/sentinel/analyse/audio   → audio file → { transcript, threat_score }
GET  /api/v1/sentinel/number/{phone}  → { risk_score, reports }
GET  /api/v1/sentinel/alerts          → list

POST /api/v1/netra/scan               → image file → { verdict, confidence, features[] }
GET  /api/v1/netra/stats              → { total_scans, counterfeits, authentic }

GET  /api/v1/jaal/communities         → list of fraud clusters
GET  /api/v1/jaal/graph/{id}          → { nodes[], edges[] }

GET  /api/v1/drishti/hotspots         → [ { lat, lng, intensity, type } ]
GET  /api/v1/drishti/heatmap          → heatmap data points

POST /api/v1/kavach/chat              → { message, session_id } → { reply, intents }
POST /api/v1/kavach/check/number      → { phone } → { safe, risk_score }

WS   /ws/sentinel/stream              → real-time analysis stream
WS   /ws/dashboard/feed               → live alert feed
```

### Mock Data Strategy
```
For prototype: All services return realistic mock data
- sentinel_service.py: keyword matching + random scoring
- netra_service.py: mock feature analysis results
- jaal_service.py: pre-seeded graph data from seed_graph.json
- drishti_service.py: pre-seeded Mumbai/Delhi incident data
- kavach_service.py: rule-based intent detection
```

---

## 🎯 Implementation Order

```
Phase 1 — Foundation (Day 1)
├── next.config.ts, tailwind.config.ts, package.json
├── globals.css (full design system CSS variables)
├── layout.tsx (fonts, theme provider wrapper)
├── Navbar.tsx, Footer.tsx
├── Button.tsx, Card.tsx, Badge.tsx
├── WireSphere.tsx, GridBackground.tsx
└── FastAPI main.py + health endpoint

Phase 2 — Landing Page (Day 1-2)
├── page.tsx (home)
├── HeroSection.tsx
├── ModulesGrid.tsx
├── ChallengesSection.tsx
├── StatsSection.tsx
└── ContactSection.tsx

Phase 3 — Core Modules (Day 2-3)
├── Dashboard layout + sidebar
├── SENTINEL pages + CallSimulator
├── NETRA scanner + results
└── KAVACH chat widget

Phase 4 — Advanced Modules (Day 3-4)
├── JAAL graph explorer
├── DRISHTI map view
└── Auth pages

Phase 5 — Backend (parallel)
├── All FastAPI routes
├── Mock services
└── WebSocket manager
```
