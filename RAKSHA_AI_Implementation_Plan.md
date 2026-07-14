<![CDATA[# 🛡️ RAKSHA AI — Implementation Plan

**AI-Powered Digital Public Safety Intelligence Platform**

> **ET AI Hackathon 2.0 — Phase 2 Prototype Submission**
> Problem Statement 6: AI for Digital Public Safety — Defeating Counterfeiting, Fraud & Digital Arrest Scams
>
> **Team:** Team DotLocal
> **Version:** 2.0 | July 2026
> **Deadline:** 22 July 2026

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Vision — RAKSHA AI](#2-platform-vision--raksha-ai)
3. [Complete Tech Stack (Latest Compatible Versions)](#3-complete-tech-stack-latest-compatible-versions)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [AI Agent Architecture & Inter-Agent Communication](#5-ai-agent-architecture--inter-agent-communication)
6. [Module 1: SENTINEL — Digital Arrest Scam Detection & Alerting](#6-module-1-sentinel--digital-arrest-scam-detection--alerting)
7. [Module 2: NETRA — Counterfeit Currency Identification Agent](#7-module-2-netra--counterfeit-currency-identification-agent)
8. [Module 3: JAAL — Fraud Network Graph Intelligence](#8-module-3-jaal--fraud-network-graph-intelligence)
9. [Module 4: DRISHTI — Geospatial Crime Pattern Intelligence](#9-module-4-drishti--geospatial-crime-pattern-intelligence)
10. [Module 5: KAVACH — Citizen Fraud Shield (Multi-Channel)](#10-module-5-kavach--citizen-fraud-shield-multi-channel)
11. [Novel Features — Our Differentiators](#11-novel-features--our-differentiators)
12. [Web Simulation Strategy](#12-web-simulation-strategy)
13. [Data Storage & Sharing Architecture](#13-data-storage--sharing-architecture)
14. [Database Schema Design](#14-database-schema-design)
15. [API Design & Endpoints](#15-api-design--endpoints)
16. [Authentication & Authorization](#16-authentication--authorization)
17. [Real-Time Infrastructure](#17-real-time-infrastructure)
18. [Deployment Architecture](#18-deployment-architecture)
19. [Evaluation Metrics & Benchmarks](#19-evaluation-metrics--benchmarks)
20. [Demo Strategy & Presentation Plan](#20-demo-strategy--presentation-plan)
21. [Appendix A: Project Folder Structure](#appendix-a-project-folder-structure)
22. [Appendix B: Implementation Timeline](#appendix-b-implementation-timeline)
23. [Appendix C: Environment Variables](#appendix-c-environment-variables)

---

## 1. Executive Summary

**RAKSHA AI** is a comprehensive, AI-powered Digital Public Safety Intelligence Platform designed to combat India's escalating cybercrime crisis. With **1.14 million cybercrime complaints registered in 2023** (up 60% from 2022) and digital arrest scams defrauding citizens of over **₹1,776 crore** in just the first nine months of 2024, there is an urgent need for a proactive, intelligence-first approach to digital safety.

Our platform shifts the paradigm from **reactive case investigation to predictive threat neutralisation**. RAKSHA AI ("Raksha" meaning "protection" in Hindi) integrates **five interconnected AI modules** — each powered by specialised AI agents that communicate, share intelligence, and act in concert — to deliver a unified command-and-control experience for law enforcement, financial institutions, and citizens alike.

### Core Value Proposition

- **Real-time detection** of digital arrest scams during active sessions — before financial transfer occurs
- **Instant counterfeit currency identification** through advanced computer vision — deployable on any device
- **Graph-based fraud network intelligence** that maps entire criminal operations across jurisdictions
- **Geospatial crime pattern analysis** with predictive hotspot modelling for resource deployment
- **Multi-channel citizen protection shield** with conversational AI in 12+ regional languages

### Key Differentiators

- 🤖 **Multi-Agent Orchestration Engine** — agents share context and escalate threats autonomously
- 📞 **Simulated real-time call/video analysis** within a web interface for demo and training
- ⛓️ **Court-admissible evidence packaging** with blockchain-anchored audit trails
- 🔐 **Federated learning** for privacy-preserving model improvement across agencies
- 🕸️ **Dark web intelligence scraping** for proactive threat detection
- 🎭 **Deepfake detection** in real-time video streams using multimodal analysis

---

## 2. Platform Vision — RAKSHA AI

**RAKSHA** stands for: **R**eal-time **A**nalysis, **K**nowledge-graph intelligence, **S**cam **H**unting, and **H**olistic **A**lerting.

### 2.1 Mission Statement

To equip law enforcement agencies, financial institutions, and citizens with proactive, AI-driven tools that detect, disrupt, and respond to digital fraud networks, counterfeit currency circulation, and organised scam operations — shifting India from a reactive complaint-based system to a **predictive intelligence-driven safety ecosystem**.

### 2.2 User Personas & Roles

| User Persona | Description | Key Features Access |
|---|---|---|
| **Law Enforcement Officer (LEO)** | Police officers, cybercrime cell investigators, intelligence analysts | Full dashboard, graph intelligence, geospatial maps, evidence packages, alert management |
| **Bank Operations Manager** | Branch managers, currency verification officers, compliance teams | Counterfeit detection tool, transaction anomaly alerts, fraud network feeds |
| **Citizen (General Public)** | Any Indian citizen who may be targeted by scammers | Fraud Shield chatbot, scam checker tool, report filing, safety advisories |
| **Command Centre Operator** | Senior LEOs operating district/state command centres | Full geospatial dashboard, resource deployment, inter-agency coordination |
| **System Administrator** | Platform administrators managing configurations | User management, model monitoring, system health, audit logs |
| **Telecom Operator** | Telco fraud detection teams receiving automated alerts | API-based alert feeds, number flagging, CDR analysis integration |

### 2.3 Platform Modules Overview

| Module | Codename | Primary AI Capabilities | Target Users |
|---|---|---|---|
| Digital Arrest Scam Detection | **SENTINEL** | NLP, Speech AI, Video Analysis, Pattern Recognition | LEOs, Telecom, Citizens |
| Counterfeit Currency ID | **NETRA** | Computer Vision, CNN, Edge AI | Banks, LEOs, Citizens |
| Fraud Network Graph | **JAAL** | Graph Neural Networks, Link Prediction, Community Detection | LEOs, Financial Institutions |
| Geospatial Intelligence | **DRISHTI** | Geospatial AI, Clustering, Predictive Analytics | Command Centres, LEOs |
| Citizen Fraud Shield | **KAVACH** | Conversational AI, Multilingual NLP, Intent Detection | Citizens |

---

## 3. Complete Tech Stack (Latest Compatible Versions)

> ⚠️ All versions below are the **latest stable releases as of July 2026**, validated for mutual compatibility.

### 3.1 Frontend

| Technology | Version | Purpose | Justification |
|---|---|---|---|
| **Next.js** (App Router) | `15.3.x` | Primary web framework | SSR/SSG, React Server Components, API routes, middleware, streaming |
| **React** | `19.1.x` | UI library | Concurrent features, use() hook, React Compiler support |
| **TypeScript** | `5.7.x` | Type-safe development | Reduces runtime errors, better IDE support, scalable codebase |
| **Tailwind CSS** | `4.1.x` | Utility-first CSS | Oxide engine (Rust-based), faster builds, CSS-first config |
| **shadcn/ui** | Latest (CLI-installed) | UI component library | Accessible, beautiful, copy-paste component collection |
| **Framer Motion** | `12.x` | Animations & transitions | Smooth micro-animations, layout animations, gesture support |
| **Recharts** | `2.15.x` | Data visualisation | Charts, graphs, statistical visualisations for dashboards |
| **@nivo/core** suite | `0.90.x` | Advanced data viz | Heatmaps, network graphs, geo projections |
| **deck.gl** | `9.2.x` | Geospatial maps | High-performance WebGL map rendering for crime hotspots |
| **Mapbox GL JS** | `3.10.x` | Map renderer | Interactive maps, geocoding, route rendering |
| **@xyflow/react** (React Flow) | `12.6.x` | Graph visualisation | Interactive node-edge graphs for fraud network visualisation |
| **Socket.io Client** | `4.8.x` | Real-time updates | Live dashboard updates, alert notifications, real-time chat |
| **PeerJS** | `1.5.x` | WebRTC simplified | Simulated video call analysis in browser |
| **react-webcam** | `7.2.x` | Camera integration | Currency scanning via device camera |
| **i18next** + **react-i18next** | `24.x` / `15.x` | Internationalisation | Support for 12+ Indian regional languages |
| **Zustand** | `5.0.x` | State management | Lightweight, zero-boilerplate global state |
| **TanStack Query** | `5.70.x` | Server state | Caching, refetching, optimistic updates for API data |

### 3.2 Backend

| Technology | Version | Purpose | Justification |
|---|---|---|---|
| **FastAPI** | `0.115.x` | Primary API server | Async-first, auto OpenAPI docs, Pydantic v2, ML ecosystem |
| **Python** | `3.12.x` | Runtime | Performance improvements, better error messages, typing |
| **Pydantic** | `2.11.x` | Data validation | Rust-core validation, 5-50x faster than v1 |
| **Uvicorn** | `0.34.x` | ASGI server | Production-grade async server |
| **Celery** | `5.5.x` | Task queue | Async processing for heavy AI inference, batch analysis |
| **Redis** (via Upstash) | `7.4.x` protocol | Message broker & cache | Pub/sub, caching, rate limiting, task queue broker |
| **LangChain** | `0.3.x` | Agent orchestration | Multi-agent workflows, tool use, structured output |
| **LangGraph** | `0.4.x` | Agent state machines | Stateful multi-agent graphs, cycles, branching |
| **CrewAI** | `0.105.x` | Multi-agent collaboration | Role-based agents with delegation, memory, tools |
| **python-socketio** | `5.12.x` | WebSocket server | Real-time bidirectional communication |

### 3.3 AI/ML Models & Libraries

| Model / Library | Version | Module | Purpose |
|---|---|---|---|
| **HuggingFace Transformers** | `4.48.x` | All | Base library for NLP/Vision model loading & fine-tuning |
| **PyTorch** | `2.6.x` | All | Deep learning framework (CUDA 12.6 support) |
| **Whisper** (`openai/whisper-large-v3-turbo`) | Latest | SENTINEL | Speech-to-text transcription, multilingual |
| **Faster-Whisper** | `1.1.x` | SENTINEL | CTranslate2-optimised Whisper inference (4x faster) |
| **IndicBERT** / **MuRIL** | Latest HF | SENTINEL, KAVACH | Multilingual Indian language NLP |
| **DistilBERT** (fine-tuned) | Latest HF | SENTINEL | Scam intent classification from text |
| **wav2vec 2.0** / **SpeechBrain** | `1.0.x` | SENTINEL | Voice spoofing & AI-voice detection |
| **pyannote-audio** | `3.3.x` | SENTINEL | Speaker diarisation |
| **EfficientNet-V2** | torchvision | NETRA | Currency image classification (real vs counterfeit) |
| **ConvNeXt V2** | HF/torchvision | NETRA | Alternative high-accuracy image classifier |
| **Ultralytics YOLOv11** | `8.3.x` | NETRA | Security feature detection (threads, watermarks, microprint) |
| **SAM 2** (Segment Anything) | Latest HF | NETRA | Precise security feature extraction & segmentation |
| **OpenCV** | `4.11.x` | NETRA | Image preprocessing, UV simulation, edge enhancement |
| **PaddleOCR** | `2.9.x` | NETRA | Serial number OCR from currency notes |
| **PyTorch Geometric (PyG)** | `2.6.x` | JAAL | Graph Neural Networks for fraud ring detection |
| **NetworkX** | `3.4.x` | JAAL | Graph analytics — centrality, community detection |
| **python-igraph** | `0.11.x` | JAAL | High-performance graph analysis |
| **scikit-learn** | `1.6.x` | DRISHTI | DBSCAN/HDBSCAN clustering for hotspot detection |
| **Prophet** | `1.1.x` | DRISHTI | Time-series forecasting for crime patterns |
| **Rasa Open Source** | `3.6.x` | KAVACH | Conversational AI engine (intent, dialog management) |
| **Meta LLaMA 3.1** (8B, quantised) | HF GGUF | All | LLM backbone for reasoning, summarisation, reports |
| **Mistral 7B v0.3** | HF | All | Alternative LLM for agent reasoning |
| **Sentence Transformers** | `3.4.x` | All | Semantic embeddings, vector search, similarity |
| **DeepFace** | `0.0.93+` | SENTINEL | Deepfake detection, face verification |
| **MediaPipe** | `0.10.x` | SENTINEL | Face mesh, liveness detection in video |
| **IndicTrans2** (AI4Bharat) | Latest HF | All | High-quality Indian language translation |

### 3.4 Databases & Storage

| Technology | Version/Tier | Purpose | Data Stored |
|---|---|---|---|
| **Supabase** (PostgreSQL 16) | Free Tier | Primary relational DB | Users, cases, reports, evidence, audit logs, alerts |
| **Upstash Vector** | Free Tier | Vector similarity search | Scam script embeddings, fraud pattern vectors, semantic index |
| **Upstash Redis** | Free Tier | Caching & real-time | Sessions, rate limiting, alert queues, pub/sub channels |
| **Firebase Auth** | Spark (Free) | Authentication | User sessions, OAuth tokens, RBAC |
| **Firebase Storage** | Spark (Free) | File/blob storage | Currency images, call recordings, evidence files |
| **Neo4j AuraDB** | Free Tier | Graph database | Fraud network graphs (nodes, edges, communities) |

### 3.5 External APIs & Services

| Service | Purpose | Integration Point |
|---|---|---|
| **SERP API** | Web intelligence gathering | Phone number reputation, known scam databases, dark web proxy |
| **Authkey.io** | SMS & Voice OTP, Alerts | SMS alerts to citizens, IVR simulation, voice-based reporting |
| **Mapbox API** | Geospatial mapping | Interactive crime maps, geocoding, patrol route optimisation |
| **HuggingFace Inference API** | Model serving | Serverless inference for lighter models without local GPU |
| **Google Cloud Vision** (optional) | OCR fallback | Extract text from currency notes for serial number validation |

### 3.6 DevOps & Infrastructure

| Technology | Version | Purpose |
|---|---|---|
| **Vercel** | Latest | Next.js frontend deployment with edge functions & CDN |
| **Railway** | Latest | FastAPI backend deployment with Docker & GPU options |
| **Docker** + **Docker Compose** | `27.x` / `2.32.x` | Local development containerisation |
| **GitHub Actions** | Latest | CI/CD pipelines for automated testing & deployment |
| **Sentry** (JS + Python SDKs) | `8.x` / `2.x` | Error tracking and performance monitoring |

### 3.7 Version Compatibility Matrix

```
Next.js 15.3 ← requires → React 19.1, Node.js ≥ 20.x
Tailwind CSS 4.1 ← requires → PostCSS 8.5+, Node.js ≥ 20.x
FastAPI 0.115 ← requires → Pydantic 2.11, Python ≥ 3.10
PyTorch 2.6 ← requires → Python 3.9–3.12, CUDA 12.6 (GPU)
LangChain 0.3 ← requires → Pydantic 2.x, Python ≥ 3.9
LangGraph 0.4 ← requires → LangChain 0.3.x
Ultralytics 8.3 ← requires → PyTorch ≥ 2.0, Python ≥ 3.8
Supabase JS Client ← requires → @supabase/supabase-js 2.49.x
Firebase JS SDK ← requires → firebase 11.x (modular API)
```

---

## 4. System Architecture Overview

### 4.1 High-Level Architecture (3-Tier)

```
┌─────────────────────────────────────────────────────────────────┐
│                  TIER 1: PRESENTATION LAYER                     │
│                      (Next.js 15.3)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ Dashboard │ │ SENTINEL │ │  NETRA   │ │ DRISHTI  │ │KAVACH│ │
│  │   Pages   │ │   UI     │ │ Scanner  │ │   Maps   │ │ Chat │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘ │
│       │ REST/WS     │ REST/WS    │ REST       │ WS       │ WS  │
└───────┴─────────────┴────────────┴────────────┴──────────┴─────┘
                              │
                    ┌─────────▼──────────┐
                    │   API GATEWAY      │
                    │  (FastAPI :8000)    │
                    │  Auth │ Rate Limit  │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                 TIER 2: INTELLIGENCE LAYER                      │
│                    (FastAPI + AI Agents)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ SENTINEL │ │  NETRA   │ │  JAAL    │ │ DRISHTI  │ │KAVACH│ │
│  │ Agent    │ │  Agent   │ │  Agent   │ │  Agent   │ │Agent │ │
│  │ :8001    │ │  :8002   │ │  :8003   │ │  :8004   │ │:8005 │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘ │
│       └──────┬──────┴──────┬─────┴──────┬─────┘          │     │
│              │   BRAHMA ORCHESTRATOR (:8006)              │     │
│              │   Inter-Agent Coordination                 │     │
│              │   Intelligence Fusion Engine               │     │
│              └──────────────┬────────────────────────────-┘     │
│                    ┌────────▼────────┐                          │
│                    │ Celery Workers  │ (GPU inference, reports) │
│                    └─────────────────┘                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    TIER 3: DATA LAYER                            │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Supabase   │ │  Upstash   │ │  Neo4j   │ │   Firebase    │  │
│  │ PostgreSQL │ │ Vector+Redis│ │ AuraDB   │ │ Auth+Storage  │  │
│  └────────────┘ └────────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Request Flow

1. **User action** in Next.js frontend (e.g., upload currency image, report scam call)
2. Next.js API route or direct FastAPI call via **REST / WebSocket**
3. **FastAPI** receives request → routes to appropriate **agent cluster**
4. Agent processes using local models + vector search + graph queries
5. Results stored in **Supabase**, embeddings cached in **Upstash Vector**
6. If cross-module intelligence detected → **BRAHMA orchestrator** notifies other agents
7. Real-time results pushed back to frontend via **WebSocket**
8. If alert threshold met → **Authkey.io** sends SMS/IVR alert to citizen/LEO

### 4.3 Microservice Decomposition

| Service Name | Port | Responsibilities |
|---|---|---|
| `api-gateway` | 8000 | Request routing, rate limiting, auth verification, API versioning |
| `sentinel-service` | 8001 | Scam detection inference, call analysis, alert generation |
| `netra-service` | 8002 | Currency image analysis, feature extraction, verdict |
| `jaal-service` | 8003 | Graph construction, fraud ring detection, evidence packaging |
| `drishti-service` | 8004 | Geospatial analysis, hotspot detection, patrol optimisation |
| `kavach-service` | 8005 | Chatbot engine, multilingual NLP, citizen interaction |
| `brahma-orchestrator` | 8006 | Inter-agent coordination, intelligence fusion, escalation |
| `worker-service` | — | Celery workers for async heavy processing |

> **For Prototype:** All services run as a single FastAPI monolith with modular routers. Microservice split is the production target architecture.

---

## 5. AI Agent Architecture & Inter-Agent Communication

The core intelligence is built on a **multi-agent system** where each module is powered by specialised AI agents. These agents are **not isolated** — they communicate, share context, delegate tasks, and collaboratively build a unified threat picture.

### 5.1 Agent Design Pattern (ReAct via LangGraph)

Each agent follows the **ReAct (Reasoning + Acting)** pattern:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
│ OBSERVE  │────▶│  THINK   │────▶│   ACT    │────▶│ REFLECT  │────▶│ COMMUNICATE  │
│ (input)  │     │ (LLM)    │     │ (tools)  │     │ (eval)   │     │ (msg bus)    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────────┘
```

- **Observe:** Receive input data (text, image, audio, graph data, geospatial coords)
- **Think:** Reason about input using LLM backbone (Mistral 7B / LLaMA 3.1)
- **Act:** Use specialised tools (ML models, database queries, API calls)
- **Reflect:** Evaluate output quality, confidence scores, decide next action
- **Communicate:** Share findings with other agents via the message bus

### 5.2 Agent Definitions

#### 🔴 SENTINEL Agent (Scam Detection)
- **Role:** Real-time digital arrest scam detection and alerting
- **Tools:** Faster-Whisper STT, IndicBERT classifier, wav2vec voice analyser, video frame extractor, alert generator
- **Memory:** Short-term (current session), Long-term (known scam patterns in Upstash Vector)
- **Triggers:** New call/video session, suspicious pattern detected, citizen report received
- **Outputs:** Scam probability score (0–1), scam type classification, evidence snapshot, alert payload

#### 🟢 NETRA Agent (Counterfeit Detection)
- **Role:** Analyse currency images and identify counterfeit notes with feature-level explanations
- **Tools:** EfficientNet-V2 classifier, YOLOv11 feature detector, OpenCV preprocessor, PaddleOCR serial number reader
- **Memory:** Known counterfeit serial number patterns (vector DB), RBI denomination specs (knowledge base)
- **Triggers:** Image upload, POS terminal scan, batch bank audit request
- **Outputs:** Real/Fake verdict, confidence %, detected anomalies, annotated image, denomination info

#### 🔵 JAAL Agent (Fraud Network)
- **Role:** Build and analyse fraud network graphs, detect coordinated operations
- **Tools:** Neo4j queries, PyG GNN models, community detection algorithms, evidence packager
- **Memory:** Persistent graph in Neo4j, pattern library in Upstash Vector
- **Triggers:** New fraud report, transaction anomaly, SENTINEL detection, NETRA counterfeit cluster
- **Outputs:** Network visualisation, key actors, money flow diagrams, court-admissible evidence packages

#### 🟡 DRISHTI Agent (Geospatial)
- **Role:** Map crime patterns geographically, predict hotspots, optimise resource deployment
- **Tools:** HDBSCAN clustering, Prophet forecasting, Mapbox renderer, patrol route optimiser
- **Memory:** Historical crime data in Supabase, spatial indexes, temporal patterns
- **Triggers:** New geotagged complaint, batch analysis request, patrol planning command
- **Outputs:** Heatmaps, hotspot alerts, predicted risk zones, optimal patrol routes

#### 🟣 KAVACH Agent (Citizen Shield)
- **Role:** Conversational AI guiding citizens through fraud assessment and reporting
- **Tools:** Rasa dialog engine, IndicBERT intent classifier, NCRB portal formatter, language detector
- **Memory:** Conversation history (Supabase), user context, FAQ knowledge base (Upstash Vector)
- **Triggers:** Citizen initiates chat, suspicious number check, report filing request
- **Outputs:** Fraud risk verdict, guided report, safety advisory, NCRB complaint draft, LEO escalation

#### ⚪ BRAHMA Orchestrator (Meta-Agent)
- **Role:** Coordinate inter-agent intelligence sharing, escalation, and unified threat assessment
- **Tools:** Message bus publisher, priority queue manager, cross-reference engine, report aggregator
- **Memory:** Global threat state, active investigations, inter-agent message history
- **Triggers:** Any agent produces high-confidence threat, cross-module correlation, manual escalation
- **Outputs:** Unified threat briefings, cross-module alerts, investigation threads, command centre updates

### 5.3 Inter-Agent Communication Protocol

Agents communicate via a **Redis pub/sub message bus** with structured event payloads:

```json
{
  "event_type": "SCAM_DETECTED | COUNTERFEIT_FOUND | NETWORK_UPDATED | HOTSPOT_ALERT | CITIZEN_REPORT",
  "source_agent": "sentinel-001",
  "target_agent": "broadcast | specific-agent-id",
  "priority": "CRITICAL | HIGH | MEDIUM | LOW",
  "payload": {
    "detection_details": {},
    "confidence": 0.94,
    "evidence_refs": ["uuid-1", "uuid-2"]
  },
  "correlation_id": "uuid-linking-related-events",
  "timestamp": "2026-07-14T09:30:00Z"
}
```

### 5.4 Intelligence Fusion Scenarios

**Scenario 1 — Scam-to-Network Escalation:**
1. SENTINEL detects a digital arrest scam call from number `+91-XXXX-YYYY`
2. BRAHMA receives `SCAM_DETECTED` → queries JAAL for known associations
3. JAAL finds `+91-XXXX-YYYY` linked to **47 other numbers** in a fraud cluster
4. BRAHMA escalates to DRISHTI → plots all 47 numbers' last known locations
5. DRISHTI identifies a geographic cluster in Jharkhand → triggers **patrol alert**
6. KAVACH proactively warns **200+ citizens** who received calls from the cluster

**Scenario 2 — Counterfeit-to-Geospatial Correlation:**
1. NETRA detects a counterfeit ₹500 note with serial prefix pattern `XY12`
2. BRAHMA queries NETRA's history → finds **15 similar notes** in last 7 days
3. DRISHTI maps all 15 detections → reveals a **distribution corridor** Mumbai → Pune
4. JAAL builds a transaction graph linking the currency to specific vendors
5. Evidence package **auto-generated** and flagged for LEO review

---

## 6. Module 1: SENTINEL — Digital Arrest Scam Detection & Alerting

### 6.1 Problem Deep Dive

Digital arrest scams are India's fastest-growing cyber threat. Scammers impersonate CBI, ED, Customs, or RBI officials via phone/video call, create urgency through fabricated legal threats ("Your Aadhaar is linked to money laundering"), and psychologically coerce victims into transferring money — often over multi-day sessions. These are **industrialised operations** with scripts, fake government portals, and AI-generated voice/video.

### 6.2 Detection Pipeline Architecture

#### Stage 1: Input Ingestion
- **Web App Simulation:** User can simulate a suspicious call/video call in the browser
- **Audio Stream:** Captured via Web Audio API → sent as chunks to backend via WebSocket
- **Video Stream:** Captured via WebRTC → key frames extracted client-side, sent to backend
- **Text Input:** User pastes SMS/WhatsApp messages or email text for analysis
- **CDR Upload:** LEOs upload Call Detail Records (CSV) for batch analysis

#### Stage 2: Speech-to-Text Processing
- **Model:** Faster-Whisper (CTranslate2-optimised Whisper Large V3 Turbo) — 4x faster than vanilla
- **Language Detection:** Automatic language ID from audio (Hindi, English + 10 regional languages)
- **Real-time Streaming:** Audio chunks transcribed with **2–3 second latency** using chunked inference
- **Speaker Diarisation:** `pyannote/speaker-diarization-3.1` to separate caller vs victim speech
- **Output:** Timestamped transcript with speaker labels and language tags

#### Stage 3: Scam Pattern Classification (Multi-Layer)

| Layer | Method | Detail |
|---|---|---|
| **Layer 1 — Intent Detection** | Fine-tuned IndicBERT | Classifies into: `INTIMIDATION`, `URGENCY_CREATION`, `IMPERSONATION`, `MONEY_DEMAND`, `LEGAL_THREAT`, `IDENTITY_THEFT_ATTEMPT`, `NORMAL` |
| **Layer 2 — Script Matching** | Sentence Transformer embeddings | Cosine similarity vs known scam script corpus in Upstash Vector (threshold > 0.82) |
| **Layer 3 — Behavioural Analysis** | Time-series dynamics | Escalation patterns, repeated demands, coercion cycles typical of digital arrest scams |
| **Layer 4 — Number Reputation** | SERP API | Lookup caller number against known scam databases, user reports, online complaints |

#### Stage 4: Voice Analysis
- **AI Voice Detection:** wav2vec 2.0 fine-tuned on ASVspoof to detect synthetic/cloned voices
- **Voice Stress Analysis:** Acoustic features (pitch, speech rate, pauses) to detect scripted vs natural speech
- **Speaker Profiling:** Accent analysis, background noise profiling (call centre vs individual)

#### Stage 5: Video Analysis (Video Call Scams)
- **Deepfake Detection:** DeepFace + temporal consistency on extracted frames
- **Uniform/Badge Verification:** YOLOv11 trained on government uniform patterns
- **Background Analysis:** Scene classification for fake government office backgrounds
- **Lip Sync Analysis:** Audio-visual correlation to detect deepfake video calls

#### Stage 6: Threat Scoring & Alert Generation
- Weighted ensemble produces **Threat Score (0–100)**
- `Score > 70`: **HIGH RISK** — immediate alert to citizen + LEO + telecom
- `Score 40–70`: **MEDIUM RISK** — advisory + flagged for review
- `Score < 40`: **LOW RISK** — logged for pattern analysis
- Alerts dispatched via: WebSocket (dashboard), Authkey.io (SMS), push notification

### 6.3 Web Simulation: Call & Video Call Analysis

**Simulated Phone Call:**
- Split-screen UI: phone call animation (left) + real-time analysis dashboard (right)
- Audio Input Options: (1) User microphone recording, (2) Upload audio file, (3) Pre-built scam scenario selection
- Real-time display: Live transcript, sentiment graph, scam probability gauge, red flag highlights

**Simulated Video Call:**
- Video player/webcam with analysis overlay
- Input Options: (1) Webcam for deepfake analysis, (2) Upload recorded video, (3) Pre-built deepfake vs real demos
- Overlay: Face mesh + authenticity score, lip sync indicator, uniform detection boxes

### 6.4 Database Schema (SENTINEL)

| Table | Key Columns | Purpose |
|---|---|---|
| `sentinel.sessions` | id, user_id, session_type, status, threat_score, created_at | Track analysis sessions |
| `sentinel.transcripts` | id, session_id, speaker, text, timestamp, language, intent_label | Transcribed text segments |
| `sentinel.voice_analyses` | id, session_id, is_synthetic, confidence, stress_level, accent | Voice analysis results |
| `sentinel.video_analyses` | id, session_id, deepfake_score, uniform_detected, bg_class | Video analysis results |
| `sentinel.alerts` | id, session_id, alert_type, severity, recipient_type, sent_via | Alert dispatch records |
| `sentinel.scam_numbers` | id, phone_number, report_count, first_seen, risk_score | Known scam number registry |

### 6.5 API Endpoints (SENTINEL)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/sentinel/analyse/audio` | Upload audio for scam analysis |
| `POST` | `/api/v1/sentinel/analyse/text` | Analyse text (SMS/email) for scam patterns |
| `POST` | `/api/v1/sentinel/analyse/video` | Upload video for deepfake + scam analysis |
| `WS` | `/ws/sentinel/stream` | Real-time audio/video stream analysis |
| `GET` | `/api/v1/sentinel/session/{id}` | Get analysis session results |
| `POST` | `/api/v1/sentinel/report` | Submit citizen scam report |
| `GET` | `/api/v1/sentinel/number/{phone}` | Check number reputation |
| `GET` | `/api/v1/sentinel/alerts` | List active alerts |

---

## 7. Module 2: NETRA — Counterfeit Currency Identification Agent

### 7.1 Problem Deep Dive

The RBI's Annual Report 2025 flagged record FICN seizures, with high-denomination ₹500 fakes sophisticated enough to defeat manual detection. Current detection relies on UV lamps and trained eyes — unavailable to the average citizen or shopkeeper. NETRA brings **AI-powered detection to any smartphone camera**.

### 7.2 Detection Pipeline

#### Stage 1: Image Capture & Preprocessing
- **Web Camera:** react-webcam with guided overlay for optimal note placement
- **Image Upload:** Drag-and-drop (JPEG, PNG, HEIF)
- **Multi-angle Capture:** Guide user for front, back, and angled views
- **Preprocessing:**
  - Auto-rotation and perspective correction (OpenCV)
  - Adaptive histogram equalisation for lighting normalisation
  - Non-local Means Denoising
  - Resolution standardisation to 1024×512 px
  - Background removal and note isolation

#### Stage 2: Denomination Classification
- **Model:** EfficientNet-V2-S fine-tuned on Indian currency dataset
- **Classes:** ₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000 (old), Unknown
- Routes to denomination-specific analysis models

#### Stage 3: Security Feature Detection

| Security Feature | Detection Method | Denominations |
|---|---|---|
| Security Thread | Object detection + pattern analysis | All |
| Watermark (Mahatma Gandhi) | Template matching + SSIM | ₹100, ₹200, ₹500 |
| Latent Image | Angle-dependent feature extraction | ₹200, ₹500 |
| Micro Lettering (RBI / भारत) | High-res crop + OCR | All |
| Intaglio Printing (raised print) | Texture analysis via Gabor filters | ₹100, ₹200, ₹500 |
| Colour-shifting Ink | Multi-angle colour analysis | ₹200, ₹500 |
| See-through Register | Front-back alignment verification | ₹200, ₹500 |
| Number Panel (fluorescent) | UV simulation via spectral analysis | All |
| Bleed Lines | Edge detection + pattern matching | All |
| Denomination Numeral | OCR + font matching | All |

#### Stage 4: Serial Number Analysis
- **OCR:** PaddleOCR extracts serial number
- **Format Validation:** Regex-based format check per denomination
- **Pattern Database:** Compare against known counterfeit patterns in Upstash Vector
- **Duplicate Detection:** Flag if serial number seen before in different locations

#### Stage 5: Holistic Authenticity Scoring
- Weighted ensemble: Security features (40%) + feature quality (30%) + serial number (15%) + print consistency (15%)
- **Verdict:** `AUTHENTIC` / `SUSPICIOUS` / `COUNTERFEIT` with confidence %
- **Explainability:** Annotated image with pass/fail bounding boxes per feature

### 7.3 Training Data Strategy
- RBI reference images (high-resolution scans of authentic notes)
- Synthetic counterfeits via StyleGAN2 for training data augmentation
- Data augmentation: rotation, lighting, perspective warps, compression, noise
- Active learning: user-reported notes with verified labels

### 7.4 API Endpoints (NETRA)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/netra/scan` | Upload currency image for analysis |
| `POST` | `/api/v1/netra/scan/batch` | Bulk upload for batch analysis |
| `GET` | `/api/v1/netra/scan/{id}` | Get scan results with annotated image |
| `GET` | `/api/v1/netra/serial/{number}` | Check serial number against database |
| `GET` | `/api/v1/netra/stats` | Get counterfeit detection statistics |
| `POST` | `/api/v1/netra/report` | Report confirmed counterfeit |

---

## 8. Module 3: JAAL — Fraud Network Graph Intelligence

### 8.1 Problem Deep Dive

Digital fraud is rarely the work of lone actors. Modern scam operations involve coordinated networks — call centres, money mules, tech infrastructure, financial intermediaries. Traditional investigation treats each complaint as isolated, **missing the forest for the trees**. JAAL uses Graph AI to map the entire criminal ecosystem.

### 8.2 Graph Data Model

#### Node Types

| Node Type | Properties | Source |
|---|---|---|
| Person | name, aadhaar_hash, phone_numbers[], role | Citizen reports, LEO inputs |
| Phone Number | number, carrier, registration_location, first/last_seen | SENTINEL, CDR uploads |
| Bank Account | account_hash, bank_name, branch, type, status | Transaction reports |
| UPI ID | upi_id_hash, linked_accounts[], creation_date | Transaction reports |
| Device | fingerprint, IMEI_hash, model, OS, location_history[] | CDR data |
| IP Address | ip, geolocation, ISP, is_vpn, is_tor | Network logs |
| Transaction | amount, timestamp, method, status | Financial reports |
| Complaint | FIR_number, description, category, status | NCRB data |
| Location | lat, lng, address, type | Geotagged reports |
| Counterfeit Note | serial_number, denomination, location, quality | NETRA detections |

#### Edge Types

| Edge Type | Source → Target | Properties |
|---|---|---|
| `CALLED` | Phone → Phone | timestamp, duration, frequency |
| `TRANSFERRED_TO` | Account → Account | amount, timestamp, method |
| `OWNS` | Person → Account/Phone/Device | verified, registration_date |
| `REPORTED_BY` | Complaint → Person | report_date, channel |
| `ASSOCIATED_WITH` | Person → Person | relationship_type, confidence |
| `LOCATED_AT` | Person/Device/Note → Location | timestamp, accuracy |
| `PART_OF_NETWORK` | Person → FraudNetwork | role, join_date, activity |
| `EVIDENCE_OF` | Transaction/Call → Complaint | relevance_score |

### 8.3 Graph Analytics Pipeline

1. **Graph Construction:** Ingest from SENTINEL, NETRA, reports, CDRs. Entity resolution via fuzzy matching. Temporal edges.
2. **Community Detection:** Louvain/Leiden algorithms to find fraud clusters
3. **Key Actor Identification:** Betweenness centrality (coordinators), PageRank (influential nodes), temporal burst detection
4. **Link Prediction:** GraphSAGE GNN to predict unobserved connections — proactive identification of unknown associates
5. **Money Flow Tracing:** Shortest path analysis, flow aggregation, layering detection (rapid multi-hop transfers)
6. **Evidence Package Generation:** Auto-generated report with network visualisation, key actors, transaction timeline, evidence chain — **court-admissible format** (timestamped, hash-verified, data source citations)

### 8.4 Web Interface — Graph Explorer
- Interactive graph: @xyflow/react force-directed layout with zoom, pan, filter
- Node Inspector: Click node → full details, connections, risk score
- Time Slider: Animate graph evolution over time
- Filter Panel: By node type, risk score, time range, location, cluster
- Evidence Export: One-click court-admissible evidence package
- Search: By phone number, account, name, or complaint reference

### 8.5 API Endpoints (JAAL)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/jaal/ingest` | Add entities/relationships to graph |
| `GET` | `/api/v1/jaal/graph/{cluster_id}` | Get fraud cluster graph data |
| `GET` | `/api/v1/jaal/search` | Search entities |
| `GET` | `/api/v1/jaal/communities` | List detected fraud communities |
| `GET` | `/api/v1/jaal/entity/{id}/connections` | Get entity connections |
| `POST` | `/api/v1/jaal/trace` | Trace money flow between entities |
| `POST` | `/api/v1/jaal/evidence-package` | Generate evidence package |
| `GET` | `/api/v1/jaal/predictions` | Get predicted links / emerging threats |

---

## 9. Module 4: DRISHTI — Geospatial Crime Pattern Intelligence

### 9.1 Problem Deep Dive

Law enforcement lacks a unified geospatial view of digital crime patterns. Complaints registered across different police stations without spatial correlation. DRISHTI creates a **real-time geospatial intelligence layer** revealing crime patterns invisible to individual officers.

### 9.2 Geospatial Data Sources
- Citizen fraud complaints with geotagged locations
- NETRA counterfeit detections with GPS coordinates
- SENTINEL scam detections with caller/victim locations
- Bank branch locations with suspicious transactions
- ATM locations with high counterfeit incidence
- CDR-derived location estimates for suspected callers
- Public NCRB crime data (historical baseline)

### 9.3 Analytics Pipeline

| Layer | Algorithm | Output |
|---|---|---|
| **Heatmap Generation** | Kernel Density Estimation (KDE) | Continuous crime heatmap surface, filterable by type/time/severity |
| **Hotspot Detection** | HDBSCAN clustering | Statistically significant crime clusters with centroid, radius, density |
| **Predictive Risk** | Prophet time-series forecasting | Risk score per grid cell for next 24/48/72 hours |
| **Patrol Optimisation** | TSP variant with time windows | Optimal patrol routes maximising coverage of high-risk areas |
| **Corridor Detection** | Serial number pattern + JAAL money flows | Counterfeit distribution corridors, inter-district movement patterns |

### 9.4 Web Interface — Command Centre Dashboard
- **Full-screen Map:** deck.gl + Mapbox with multiple toggleable layers
- **Live Incident Feed:** Real-time sidebar with new reports + map markers
- **Hotspot Details:** Click hotspot → statistics, trend charts, recent incidents
- **Patrol Planner:** Assign patrol units, visualise coverage
- **Time Machine:** Slider for historical pattern evolution
- **District Comparison:** Side-by-side statistics with ranking

### 9.5 API Endpoints (DRISHTI)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/drishti/heatmap` | Heatmap data for given bounds/filters |
| `GET` | `/api/v1/drishti/hotspots` | Detected crime hotspots |
| `GET` | `/api/v1/drishti/predict` | Predictive risk scores |
| `POST` | `/api/v1/drishti/patrol/optimise` | Generate optimal patrol routes |
| `GET` | `/api/v1/drishti/corridors` | Distribution corridors |
| `GET` | `/api/v1/drishti/stats/{district}` | District statistics |
| `GET` | `/api/v1/drishti/timeline` | Temporal crime patterns |
| `WS` | `/ws/drishti/live` | Real-time incident updates |

---

## 10. Module 5: KAVACH — Citizen Fraud Shield (Multi-Channel)

### 10.1 Problem Deep Dive

Citizens are the first and most vulnerable contact point. Most victims don't realise they're being scammed until money is transferred. KAVACH provides an accessible, **multilingual AI assistant** for real-time fraud assessment, guided reporting, and safety advisories.

### 10.2 Channel Strategy (Web App Focus)

| Channel | Web App Implementation | Future Expansion |
|---|---|---|
| **Web Chat** | Embedded chatbot widget on every page (primary mode) | Standalone web app |
| **WhatsApp Sim** | Pixel-perfect WhatsApp-style UI with demo conversations | WhatsApp Business API |
| **IVR Sim** | Phone IVR flow in browser with audio prompts + keypad | Authkey.io IVR |
| **SMS** | Live SMS alerts via Authkey.io | Already functional |
| **Mobile** | Responsive PWA for mobile access | Native React Native app |

### 10.3 Chatbot Core Intents

| Intent | Example | KAVACH Response |
|---|---|---|
| `check_suspicious_call` | "I got a call from CBI, is it real?" | Analyse against scam patterns → verdict with confidence |
| `check_number` | "Is 9876543210 safe?" | Query SENTINEL DB → risk score + report history |
| `check_message` | "Is this SMS a scam?" (pastes text) | NLP intent classification → fraud probability + advice |
| `report_fraud` | "I was scammed, how do I report?" | Guided report → NCRB complaint draft → helpline numbers |
| `check_upi_request` | "Got a UPI collect request" | Check sender UPI ID against fraud DB → advise |
| `learn_safety` | "How do I protect myself?" | Contextual tips based on trending scam patterns |
| `emergency` | "They have my bank details!" | Freeze account steps, bank helplines, police contact |
| `language_switch` | "Hindi mein baat karo" | Switch language, continue in requested language |

### 10.4 Multilingual Support
- **Primary:** Hindi, English
- **Phase 1:** Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada
- **Phase 2:** Malayalam, Punjabi, Odia, Assamese
- **Implementation:** IndicBERT intent classification + IndicTrans2 translation + language-specific Rasa NLU models

### 10.5 API Endpoints (KAVACH)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/kavach/chat` | Send message, get AI response |
| `GET` | `/api/v1/kavach/session/{id}` | Full conversation history |
| `POST` | `/api/v1/kavach/check/number` | Quick number reputation check |
| `POST` | `/api/v1/kavach/check/message` | Quick message scam analysis |
| `POST` | `/api/v1/kavach/report/draft` | Generate NCRB complaint draft |
| `POST` | `/api/v1/kavach/sms/alert` | Trigger SMS alert via Authkey.io |
| `GET` | `/api/v1/kavach/safety-tips` | Latest safety advisories |
| `POST` | `/api/v1/kavach/ivr/interact` | IVR simulation interaction |

---

## 11. Novel Features — Our Differentiators

Beyond the core modules, these **10 novel features** significantly differentiate RAKSHA AI:

### 11.1 🎭 Real-Time Deepfake Shield (SENTINEL+)

Operates during web-simulated video calls:
- **Face Liveness Detection:** 3D depth estimation from 2D video (screen/photo playback detection)
- **Temporal Consistency:** Track facial landmarks across frames — deepfakes show micro-jitter
- **Audio-Visual Synchrony:** Lip movement ↔ speech correlation (deepfakes show desync)
- **Identity Verification:** If caller claims "CBI Officer Sharma" → compare face against official databases
- **Tech:** MediaPipe Face Mesh + custom temporal CNN + wav2vec AV alignment model

### 11.2 🕸️ Dark Web Intelligence Crawler (JAAL+)

Proactively monitors for:
- Leaked scam scripts and operational playbooks
- Money mule recruitment advertisements
- Sale of stolen identity data (Aadhaar, PAN, bank details)
- Counterfeit currency vendor listings
- New scam technique discussions

> **Prototype:** SERP API searches publicly indexed scam-related content to demonstrate the intelligence pipeline.

### 11.3 🎮 Scam Simulation Training Engine (KAVACH+)

Interactive citizen training module:
- **Scenario Library:** 10+ scam scenarios (CBI digital arrest, lottery, KYC, investment fraud)
- **Interactive Roleplay:** AI plays the scammer, user responds, system evaluates decisions
- **Red Flag Highlights:** After each interaction, explains what red flags were present
- **Scorecard:** Awareness score + personalised improvement recommendations
- **Gamification:** Badges, leaderboards, "Scam Awareness Level" certifications

### 11.4 ⛓️ Blockchain-Anchored Evidence Chain (JAAL+)

Court-admissible evidence integrity:
- Every evidence artifact SHA-256 hashed
- Hashes anchored to **Polygon Amoy testnet** (free) via smart contract
- Evidence package includes blockchain tx ID for independent verification
- Timestamped + immutable — any tampering detectable

### 11.5 🔗 Federated Threat Intelligence Network

Cross-agency intelligence sharing without raw data exposure:
- Each agency runs local RAKSHA instance
- **Federated model updates:** Shared model weights, not data
- Anonymised threat indicators shared via secure API
- **Prototype Demo:** Simulate two agency instances, show cross-agency alert propagation

### 11.6 📋 AI-Powered Evidence Summariser

For LEOs understanding complex fraud cases:
- Input: All case evidence (transcripts, graphs, images, reports)
- Output: Structured legal summary with findings, evidence chain, recommended actions
- **Multi-format:** FIR draft, chargesheet summary, prosecution brief
- **Tech:** LLaMA 3.1 with RAG over case evidence in Upstash Vector

### 11.7 🎯 Predictive Victim Identification

Proactive protection:
- Analyse past victim profiles (age, profession, digital literacy, location)
- Identify emerging target demographics from scam trend analysis
- Proactive outreach via Authkey.io SMS to high-risk demographics
- **Privacy-first:** Aggregate statistics only, no individual targeting

### 11.8 🌐 Real-Time Translation & Interpretation Engine

Cross-language intelligence for multilingual India:
- Tamil scam call → auto-translated + analysed in English for national intelligence
- Evidence packages in investigating officer's language
- Cross-language scam pattern matching (Hindi script ↔ Kannada variant)
- **Tech:** IndicTrans2 (AI4Bharat) + cross-lingual Sentence Transformers

### 11.9 ✅ Citizen Trust Score (Privacy-Preserving)

Government communication verification:
- Agencies register official channels on RAKSHA
- Citizens verify: "Did CBI really call from this number?" against registered DB
- QR code verification on official notices
- Two-way callback verification through KAVACH

### 11.10 📊 Financial Transaction Anomaly Detection

Real-time bank integration:
- Isolation Forest / Autoencoder on normal transaction patterns
- Flag: sudden large transfers, rapid multiple UPI txns, unusual timing
- Flagged transactions auto-ingested into JAAL graph
- Direct bank alert API for partner institutions

---

## 12. Web Simulation Strategy

Since RAKSHA AI is a **web app prototype**, real-world functionalities are simulated convincingly in-browser.

### 12.1 Phone Call Simulation

**Architecture:**
- Custom "Phone Call" UI: caller ID, duration timer, call controls (mute, speaker, end)
- Audio Engine: Web Audio API + WebSocket streaming to backend
- Scenario Engine: Pre-built call scenarios with TTS-generated/recorded scammer audio

**User Flow:**
1. Click "Simulate Scam Call" → select scenario (e.g., "CBI Digital Arrest - Hindi")
2. Full-screen incoming call animation
3. Pre-recorded scammer audio plays; user's mic captures responses (optional)
4. Audio streamed via WebSocket → Faster-Whisper STT → SENTINEL pipeline
5. Real-time overlay: live transcript, scam probability gauge, red flag highlights
6. "End call" → full analysis report generated

**Alternative — Upload Mode:** Upload audio file (MP3/WAV/OGG) → full analysis report

### 12.2 Video Call Simulation

- Split-screen: simulated "other party" video + user webcam
- **Scenario Mode:** Pre-recorded video plays while analysis runs
- **Analysis Mode:** Upload recorded video call
- **Live Webcam Mode:** Real-time deepfake detection on user's webcam
- **Overlay:** Deepfake score, face mesh, lip sync, uniform detection boxes

### 12.3 WhatsApp Simulation

- Pixel-perfect WhatsApp-style chat UI (green theme, bubbles, status ticks)
- Messages routed to KAVACH backend
- Rich responses: media cards, quick replies
- Demonstrates WhatsApp bot functionality

### 12.4 IVR Simulation

- Phone keypad UI with screen display
- Audio prompts in 4 languages via Web Audio API
- Input: keypad clicks (DTMF simulation) or voice (Whisper STT)
- Demonstrates accessibility for non-smartphone users

### 12.5 SMS Alert (Live)

- **Actually sends SMS** via Authkey.io API
- Web UI shows SMS in phone notification mockup
- Triggered by: SENTINEL high-risk, KAVACH emergency, DRISHTI hotspot

### 12.6 Command Centre Simulation

- Full-screen dashboard for large displays (1920×1080+)
- Multi-panel: Map (centre), Alert Feed (left), Statistics (right), Cases (bottom)
- WebSocket pushes simulated real-time events
- Modeled after Dial 100 / CCTNS interfaces

---

## 13. Data Storage & Sharing Architecture

### 13.1 Three Data Sharing Mechanisms

| Mechanism | Technology | Use Case |
|---|---|---|
| **Shared Database** | Supabase PostgreSQL | Persistent data sharing via foreign keys. Each module has schema namespace. |
| **Event Bus** | Upstash Redis Pub/Sub | Real-time events: alert propagation, cross-module triggers, dashboard updates |
| **Vector Store** | Upstash Vector | Shared embedding space for semantic similarity across scam scripts, fraud patterns, queries |

### 13.2 Data Namespace Design

| Namespace | Module | Data Types | Storage |
|---|---|---|---|
| `sentinel.*` | SENTINEL | Scam sessions, transcripts, voice analysis, alerts | Supabase + Redis |
| `netra.*` | NETRA | Scan results, annotated images, serial numbers | Supabase + Firebase Storage |
| `jaal.*` | JAAL | Graph nodes, edges, communities, evidence | Neo4j + Supabase |
| `drishti.*` | DRISHTI | Geospatial events, hotspots, patrol plans | Supabase + Redis |
| `kavach.*` | KAVACH | Chat sessions, user profiles, reports | Supabase |
| `shared.*` | All | Users, roles, audit logs, cross-references | Supabase |
| `vectors.*` | All | Embeddings for scripts, patterns, FAQs | Upstash Vector |

### 13.3 Cross-Module Data Flow Examples

**SENTINEL → JAAL:**
1. SENTINEL detects scam from phone X → writes to Supabase
2. Publishes `SCAM_DETECTED` to Redis with phone + threat details
3. JAAL listener picks up → queries Neo4j for phone X associations
4. If known: enriches node with evidence. If new: creates node + links.

**NETRA → DRISHTI:**
1. NETRA detects counterfeit at GPS (19.07°N, 72.87°E) → writes to Supabase
2. Publishes `COUNTERFEIT_DETECTED` to Redis
3. DRISHTI adds point to spatial dataset → runs incremental hotspot update
4. If new hotspot formed → publishes `HOTSPOT_ALERT` → Command Centre updated

**KAVACH → SENTINEL:**
1. Citizen tells KAVACH: "I'm on a call with someone claiming CBI"
2. KAVACH extracts phone number, duration, claims
3. Sends analysis request to SENTINEL internal API
4. SENTINEL checks reputation + scam patterns → returns risk assessment
5. If HIGH RISK → KAVACH triggers emergency → SMS alert via Authkey.io

### 13.4 Caching Strategy

| Cache Layer | Technology | TTL | Data |
|---|---|---|---|
| API Response | Upstash Redis | 5 min | Dashboard stats, heatmap tiles, hotspot lists |
| Model Inference | Upstash Redis | 1 hour | Number reputation, serial number checks |
| Session | Upstash Redis | 30 min | User sessions, chat contexts, analysis progress |
| Static Assets | Vercel Edge | 24 hours | Map tiles, UI assets |
| Vector Search | In-memory (FastAPI) | 10 min | Frequent similarity results |

---

## 14. Database Schema Design

> All tables use UUID primary keys, timestamps, and Row Level Security (RLS) via Supabase.

### 14.1 Shared Schema

| Table | Columns |
|---|---|
| `shared.users` | id (UUID PK), firebase_uid, email, name, role (citizen/leo/bank/admin), phone, language_pref, created_at, updated_at |
| `shared.audit_logs` | id, user_id (FK), action, resource_type, resource_id, ip_address, metadata (JSONB), created_at |
| `shared.notifications` | id, user_id (FK), type, title, body, channel, status, created_at |
| `shared.cases` | id, title, description, status, assigned_to (FK), severity, modules_involved (text[]), created_at |
| `shared.case_evidence` | id, case_id (FK), evidence_type, source_module, source_id, hash_sha256, blockchain_tx_id, metadata (JSONB) |

### 14.2 SENTINEL Schema

| Table | Columns |
|---|---|
| `sentinel.sessions` | id, user_id, session_type (call/video/text/cdr), status, threat_score, scam_type, caller_number, duration_seconds, language_detected, created_at, completed_at |
| `sentinel.transcripts` | id, session_id (FK), speaker, text, start_time, end_time, language, intent_label, confidence |
| `sentinel.voice_analyses` | id, session_id (FK), is_synthetic, synthetic_confidence, stress_level, speech_rate, accent_profile, bg_noise_type |
| `sentinel.video_analyses` | id, session_id (FK), deepfake_score, lip_sync_score, uniform_detected, uniform_type, bg_classification, face_count |
| `sentinel.alerts` | id, session_id (FK), alert_type, severity, recipient_type, sent_via, status, recipient_id, created_at |
| `sentinel.scam_numbers` | id, phone_number (unique), total_reports, first_reported, last_reported, risk_score, carrier, status |

### 14.3 NETRA Schema

| Table | Columns |
|---|---|
| `netra.scans` | id, user_id, image_url, denomination, verdict, confidence, overall_score, latitude, longitude, scan_source, created_at |
| `netra.feature_results` | id, scan_id (FK), feature_name, detected (bool), quality_score, bounding_box (JSONB), notes |
| `netra.serial_numbers` | id, scan_id (FK), extracted_number, format_valid, is_duplicate, known_pattern, previous_detection_ids (UUID[]) |
| `netra.counterfeit_patterns` | id, serial_prefix, denomination, description, first_seen, detection_count, geographic_spread (JSONB) |

### 14.4 JAAL Schema (Supabase Metadata)

| Table | Columns |
|---|---|
| `jaal.communities` | id, name, node_count, edge_count, density, dominant_crime_type, geographic_center, first_detected, last_active, status |
| `jaal.evidence_packages` | id, case_id (FK), community_id (FK), title, description, generated_at, file_url, hash_sha256, blockchain_tx_id |
| `jaal.entity_metadata` | id, neo4j_node_id, entity_type, display_name, risk_score, first_seen, last_seen, total_connections, metadata (JSONB) |

> **Note:** Primary graph data (nodes + edges) stored in **Neo4j**. Supabase stores metadata, evidence, and cross-references.

### 14.5 DRISHTI Schema

| Table | Columns |
|---|---|
| `drishti.incidents` | id, incident_type, source_module, source_id, latitude, longitude, district, state, severity, description, reported_at |
| `drishti.hotspots` | id, centroid_lat, centroid_lng, radius_km, incident_count, dominant_type, density_score, first_detected, status |
| `drishti.predictions` | id, grid_cell_id, predicted_risk_score, prediction_horizon_hours, crime_types (JSONB), model_version, valid_until |
| `drishti.patrol_plans` | id, district, planned_date, unit_count, route_geojson (JSONB), coverage_score, created_by, status |

### 14.6 KAVACH Schema

| Table | Columns |
|---|---|
| `kavach.sessions` | id, user_id, channel, language, started_at, ended_at, message_count, resolved (bool) |
| `kavach.messages` | id, session_id (FK), role (user/bot), content, intent_detected, confidence, language, quick_replies (JSONB) |
| `kavach.reports` | id, session_id (FK), user_id, report_type, description, evidence_refs (JSONB), ncrb_draft_text, filed_externally |
| `kavach.number_checks` | id, session_id, checked_number, result, risk_score, report_count, checked_at |

---

## 15. API Design & Endpoints

### 15.1 API Architecture
- **Base URL:** `/api/v1/`
- **Authentication:** Firebase Auth JWT in `Authorization: Bearer <token>` header
- **Rate Limiting:** Upstash Redis-based (100 req/min citizens, 1000 req/min LEOs)
- **Response Format:** `{ success: bool, data: {}, error: string|null, meta: {} }`
- **Pagination:** Cursor-based for list endpoints
- **Versioning:** URL-based (`/api/v1/`, `/api/v2/`)

### 15.2 Gateway Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user | No |
| `POST` | `/api/v1/auth/login` | Login and get JWT | No |
| `GET` | `/api/v1/auth/profile` | Get user profile | Yes |
| `PUT` | `/api/v1/auth/profile` | Update profile | Yes |
| `GET` | `/api/v1/dashboard/stats` | Unified dashboard stats | Yes (LEO/Admin) |
| `GET` | `/api/v1/cases` | List investigation cases | Yes (LEO) |
| `POST` | `/api/v1/cases` | Create new case | Yes (LEO) |
| `GET` | `/api/v1/cases/{id}` | Case details with evidence | Yes (LEO) |
| `GET` | `/api/v1/notifications` | User notifications | Yes |
| `POST` | `/api/v1/search` | Unified cross-module search | Yes |

### 15.3 WebSocket Endpoints

| Endpoint | Purpose | Events |
|---|---|---|
| `/ws/sentinel/stream` | Real-time call/video analysis | `transcript_update`, `threat_score_update`, `alert_triggered` |
| `/ws/drishti/live` | Live map incident updates | `new_incident`, `hotspot_update`, `patrol_update` |
| `/ws/kavach/chat` | Real-time chat | `bot_message`, `typing_indicator`, `quick_reply_options` |
| `/ws/dashboard/feed` | Dashboard live feed | `new_alert`, `stat_update`, `case_update` |
| `/ws/jaal/graph-updates` | Live graph changes | `node_added`, `edge_added`, `community_updated` |

---

## 16. Authentication & Authorization

### 16.1 Authentication Flow
- **Firebase Authentication** handles all auth flows
- Supported: Email/Password, Google OAuth, Phone OTP (via Authkey.io)
- JWT tokens issued by Firebase, validated by FastAPI middleware
- Token refresh handled automatically by Firebase SDK on frontend

### 16.2 Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `citizen` | KAVACH chatbot, currency scan, number check, report filing, personal dashboard |
| `leo` | Full SENTINEL dashboard, JAAL explorer, DRISHTI maps, evidence, case management |
| `bank` | NETRA batch scanning, transaction anomaly alerts, fraud feeds (read-only) |
| `command_centre` | All LEO + DRISHTI command centre + patrol management + inter-agency |
| `admin` | All + user management + model monitoring + system config + audit logs |

### 16.3 Row Level Security (Supabase RLS)
- Citizens → own data only
- LEOs → jurisdiction data
- Command Centre → cross-jurisdiction
- Admins → unrestricted
- Audit logs → **append-only** (no deletions)

---

## 17. Real-Time Infrastructure

### 17.1 WebSocket Architecture
- FastAPI native WebSocket + `python-socketio` for room-based broadcasting
- Connection Manager: tracks active connections per user, per module
- Room subscriptions: `dashboard`, `drishti-map`, `sentinel-session-{id}`
- Heartbeat: 30s ping/pong for stale connection detection
- Client reconnection: exponential backoff (1s, 2s, 4s, 8s, max 30s)

### 17.2 Event-Driven Architecture
- **Redis Pub/Sub:** Inter-service event broadcasting
- **Event Sourcing:** All state changes stored in `audit_logs` for replay
- **CQRS:** Separate read models (dashboard-optimised) from write models (normalised)

### 17.3 Background Task Processing
- **Celery Workers:** Heavy AI inference (Whisper STT, EfficientNet, GNN)
- **Priority Queues:** CRITICAL (alerts), HIGH (analysis), MEDIUM (batch), LOW (reports)
- **Task Status:** Redis-backed with WebSocket notifications on completion

---

## 18. Deployment Architecture

### 18.1 Infrastructure

| Component | Platform | Tier | Reason |
|---|---|---|---|
| Next.js Frontend | **Vercel** | Hobby (Free) | Native Next.js, edge functions, CDN |
| FastAPI Backend | **Railway** | Starter ($5/mo) | Docker, scaling, GPU available |
| Supabase | **Supabase Cloud** | Free | PostgreSQL + Auth + Storage + Realtime |
| Upstash Vector | **Upstash** | Free | Serverless vector DB, pay-per-use |
| Upstash Redis | **Upstash** | Free | Serverless Redis, global distribution |
| Neo4j | **Neo4j AuraDB** | Free | Managed graph database |
| Firebase | **Firebase** | Spark (Free) | Auth + Storage |
| HuggingFace | **HF Inference API** | Free | Serverless model inference |

### 18.2 CI/CD Pipeline
- **Monorepo:** `/frontend` (Next.js) + `/backend` (FastAPI)
- **Branches:** `main` (production), `develop` (staging), `feature/*`
- **GitHub Actions:** lint → test → deploy (staging on develop, production on main)

### 18.3 Local Development
- **Docker Compose:** All services containerised
- **Hot Reload:** Next.js dev server + FastAPI `--reload`
- **Seed Data:** Scripts to populate with realistic demo data
- **Mock Services:** Mock Authkey.io, SERP API for local testing

---

## 19. Evaluation Metrics & Benchmarks

### 19.1 SENTINEL

| Metric | Target | Method |
|---|---|---|
| Scam Detection Precision | **> 92%** | Flagged sessions that are actual scams |
| Scam Detection Recall | **> 88%** | Actual scams correctly identified |
| False Positive Rate | **< 5%** | Non-scam sessions incorrectly flagged |
| Detection Latency | **< 30 sec** | Time from call start to first alert |
| Deepfake Detection Accuracy | **> 90%** | Correct synthetic video/audio identification |
| Language Coverage | **4+ languages** | Languages with > 85% transcription accuracy |

### 19.2 NETRA

| Metric | Target | Method |
|---|---|---|
| Detection Accuracy | **> 95%** | Correct real/fake across denominations |
| Per-Denomination Accuracy | **> 93% each** | Breakdown for ₹100, ₹200, ₹500 |
| False Positive Rate | **< 3%** | Genuine notes flagged as counterfeit |
| Feature Detection mAP | **> 0.85** | Security feature localisation precision |
| Inference Time | **< 3 sec** | Image upload to verdict |
| Serial Number OCR | **> 90%** | Correct extraction rate |

### 19.3 JAAL

| Metric | Target | Method |
|---|---|---|
| Network Detection Recall | **> 85%** | Fraud clusters correctly identified |
| Key Actor Precision | **> 80%** | Network coordinator identification |
| Link Prediction AUC | **> 0.82** | Predicted unobserved connections quality |
| Evidence Completeness | **> 90%** | Required evidence fields populated |
| Lead Time | **> 24 hours** | Early warning before campaign peaks |

### 19.4 DRISHTI

| Metric | Target | Method |
|---|---|---|
| Hotspot Detection F1 | **> 0.80** | Crime cluster detection balance |
| Prediction Accuracy (24h) | **> 75%** | Predicted zones with actual incidents |
| Patrol Coverage Improvement | **> 30%** | vs random patrol baselines |
| Map Rendering Latency | **< 2 sec** | Full heatmap with 10,000+ points |

### 19.5 KAVACH

| Metric | Target | Method |
|---|---|---|
| Intent Detection Accuracy | **> 90%** | Correct citizen intent classification |
| Response Relevance | **> 85%** | Responses rated helpful by testers |
| False Alarm Rate | **< 5%** | Safe messages flagged as scams |
| Language Quality | **> 80% in 4 languages** | Per-language intent accuracy |
| Response Latency | **< 2 sec** | User message to bot response |
| Report Completion Rate | **> 70%** | Users completing guided report flow |

---

## 20. Demo Strategy & Presentation Plan

### 20.1 Demo Flow (10–15 Minutes)

| Segment | Duration | Content |
|---|---|---|
| **Opening** | 2 min | Problem context → cybercrime crisis → RAKSHA AI intro → architecture |
| **Demo 1: SENTINEL** | 3 min | Play Hindi CBI scam call → live transcript → scam gauge → SMS alert |
| **Demo 2: NETRA** | 2 min | Live camera scan (authentic) → upload counterfeit → feature analysis |
| **Demo 3: JAAL** | 2 min | Pre-built 50+ node graph → community detection → evidence package |
| **Demo 4: DRISHTI** | 2 min | Mumbai heatmap → toggle layers → predictive zones → patrol routes |
| **Demo 5: KAVACH** | 2 min | Live chat → WhatsApp sim → Hindi interaction → IVR demo |
| **Cross-Module** | 1 min | SENTINEL → JAAL → DRISHTI → KAVACH intelligence cascade |
| **Closing** | 1 min | Impact metrics, scalability, roadmap, Q&A |

### 20.2 Demo Data Preparation
- Pre-recorded scam audios: 3 scenarios (Hindi CBI, English Customs, Marathi Bank)
- Currency images: 5 authentic + 5 synthetic counterfeit across denominations
- Fraud network: Seeded Neo4j with 100+ nodes, 200+ edges
- Geospatial: 500+ geotagged incidents across Mumbai, Delhi, Bangalore
- Chat scenarios: 10+ pre-tested flows across languages

### 20.3 Backup Plan
- Pre-recorded video backups for all demos
- Offline-capable: key features work with cached models
- Fallback data: pre-loaded results if API calls fail

### 20.4 Presentation Deck (15 Slides)

1. Title + Team
2. Problem Context (Statistics + Human Impact)
3. Our Solution — RAKSHA AI Overview
4. Architecture Diagram
5. SENTINEL Deep Dive
6. NETRA Deep Dive
7. JAAL Deep Dive
8. DRISHTI Deep Dive
9. KAVACH Deep Dive
10. Novel Features
11. Tech Stack
12. Live Demo
13. Impact & Metrics
14. Scalability & Future Roadmap
15. Team & Thank You

---

## Appendix A: Project Folder Structure

```
raksha-ai/
├── frontend/                        # Next.js 15.3 App
│   ├── app/                         # App Router pages
│   │   ├── (auth)/                  # Auth pages (login, register)
│   │   ├── dashboard/               # Main dashboard
│   │   ├── sentinel/                # Scam detection pages
│   │   │   ├── analyse/             # Upload/stream analysis
│   │   │   ├── alerts/              # Alert management
│   │   │   └── simulate/            # Call/video simulation
│   │   ├── netra/                   # Currency scanner pages
│   │   │   ├── scan/                # Camera/upload scan
│   │   │   └── history/             # Scan history
│   │   ├── jaal/                    # Graph intelligence pages
│   │   │   ├── explorer/            # Graph visualisation
│   │   │   └── evidence/            # Evidence packages
│   │   ├── drishti/                 # Geospatial pages
│   │   │   ├── map/                 # Full-screen map view
│   │   │   └── command/             # Command centre view
│   │   ├── kavach/                  # Citizen shield pages
│   │   │   ├── chat/                # Chat interface
│   │   │   ├── whatsapp/            # WhatsApp simulation
│   │   │   └── ivr/                 # IVR simulation
│   │   └── admin/                   # Admin panel
│   ├── components/                  # Shared React components
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── charts/                  # Data visualisation
│   │   ├── maps/                    # Map components
│   │   ├── graphs/                  # Graph visualisation
│   │   └── simulation/              # Call/video simulation
│   ├── lib/                         # Utilities
│   │   ├── api.ts                   # API client
│   │   ├── firebase.ts              # Firebase config
│   │   ├── supabase.ts              # Supabase client
│   │   └── websocket.ts             # WebSocket manager
│   ├── hooks/                       # Custom React hooks
│   ├── stores/                      # Zustand state stores
│   └── public/                      # Static assets
│       ├── audio/                   # Pre-recorded scam audios
│       ├── demo-videos/             # Demo recordings
│       └── currency-samples/        # Sample currency images
├── backend/                         # FastAPI Application
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── config.py                # Config management
│   │   ├── middleware/               # Auth, CORS, rate limiting
│   │   ├── models/                  # Pydantic models
│   │   ├── routes/                  # API route handlers
│   │   │   ├── sentinel.py
│   │   │   ├── netra.py
│   │   │   ├── jaal.py
│   │   │   ├── drishti.py
│   │   │   └── kavach.py
│   │   ├── agents/                  # AI Agent definitions
│   │   │   ├── sentinel_agent.py
│   │   │   ├── netra_agent.py
│   │   │   ├── jaal_agent.py
│   │   │   ├── drishti_agent.py
│   │   │   ├── kavach_agent.py
│   │   │   └── brahma_orchestrator.py
│   │   ├── ml/                      # ML model wrappers
│   │   │   ├── whisper_stt.py
│   │   │   ├── scam_classifier.py
│   │   │   ├── voice_analyser.py
│   │   │   ├── currency_detector.py
│   │   │   ├── deepfake_detector.py
│   │   │   └── graph_models.py
│   │   ├── services/                # Business logic
│   │   ├── db/                      # Database connections
│   │   │   ├── supabase.py
│   │   │   ├── neo4j.py
│   │   │   ├── upstash_vector.py
│   │   │   └── upstash_redis.py
│   │   └── workers/                 # Celery task definitions
│   ├── tests/                       # Test suite
│   ├── scripts/
│   │   ├── seed_data.py             # Database seeding
│   │   └── train_models.py          # Model training
│   ├── models/                      # Trained model weights
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml               # Local dev setup
├── .github/workflows/               # CI/CD pipelines
└── README.md
```

---

## Appendix B: Implementation Timeline

**Deadline:** 22 July 2026 | **Available:** ~8 days remaining

| Day | Tasks | Deliverables |
|---|---|---|
| **Day 1** | Project scaffolding: Next.js 15 + FastAPI + DB setup + Firebase Auth + environment config | Running frontend + backend with auth |
| **Day 2** | SENTINEL — Faster-Whisper integration, scam classifier training, call simulation UI | Working scam detection on uploaded audio |
| **Day 3** | NETRA — EfficientNet training, YOLOv11 feature detection, camera UI, preprocessing | Working counterfeit scanner |
| **Day 4** | KAVACH — Rasa chatbot setup, core intents, chat widget + WhatsApp sim UI | Working chatbot with 8+ intents |
| **Day 5** | JAAL — Neo4j setup, graph model, @xyflow/react visualisation, community detection | Working fraud network explorer |
| **Day 6** | DRISHTI — Mapbox/deck.gl integration, heatmap, hotspot detection, command centre UI | Working geospatial dashboard |
| **Day 7** | BRAHMA orchestrator + novel features (deepfake shield, training engine, evidence summariser) | Cross-module intelligence + 3 novel features |
| **Day 8** | Demo prep: seed data, demo scripts, presentation deck, video recording, polish | Complete demo-ready prototype |

---

## Appendix C: Environment Variables

```env
# ── Firebase ──────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_SDK_KEY=

# ── Supabase ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── Upstash Vector ────────────────────────────────────
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=

# ── Upstash Redis ─────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Neo4j ─────────────────────────────────────────────
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=

# ── External APIs ─────────────────────────────────────
SERP_API_KEY=
AUTHKEY_API_KEY=
MAPBOX_ACCESS_TOKEN=
HUGGINGFACE_API_TOKEN=

# ── FastAPI ───────────────────────────────────────────
FASTAPI_SECRET_KEY=
FASTAPI_DEBUG=true
CELERY_BROKER_URL=redis://localhost:6379/0
```

---

<div align="center">

### — End of Implementation Plan —

**RAKSHA AI — Protecting India's Digital Future** 🛡️

</div>
]]>
