const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  convertInchesToTwip,
  LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Helper Functions ──────────────────────────────────────────────────────────

function title(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 56, color: "1a1a2e", font: "Segoe UI" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  });
}

function subtitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 28, color: "4a4a6a", font: "Segoe UI", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  });
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: "0f3460", font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "0f3460" } },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 30, color: "16213e", font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: "1a1a2e", font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 250, after: 120 },
  });
}

function h4(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "333366", font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 200, after: 100 },
  });
}

function para(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Segoe UI", color: "2d2d2d" })],
    spacing: { after: 120 },
  });
}

function boldPara(label, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: "Segoe UI", color: "1a1a2e" }),
      new TextRun({ text, size: 22, font: "Segoe UI", color: "2d2d2d" }),
    ],
    spacing: { after: 100 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Segoe UI", color: "2d2d2d" })],
    bullet: { level },
    spacing: { after: 60 },
  });
}

function bulletBold(label, text, level = 0) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: "Segoe UI", color: "0f3460" }),
      new TextRun({ text, size: 22, font: "Segoe UI", color: "2d2d2d" }),
    ],
    bullet: { level },
    spacing: { after: 60 },
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}

function makeTable(headers, rows) {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 20, font: "Segoe UI", color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { type: ShadingType.SOLID, color: "0f3460" },
        width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
      })
  );
  const dataRows = rows.map(
    (row, idx) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, size: 20, font: "Segoe UI", color: "2d2d2d" })],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? "f0f4ff" : "FFFFFF" },
            })
        ),
      })
  );
  return new Table({
    rows: [new TableRow({ children: headerCells }), ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function notePara(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "Note: ", size: 22, font: "Segoe UI", bold: true, color: "0f3460" }),
      new TextRun({ text, size: 22, font: "Segoe UI", italics: true, color: "0f3460" }),
    ],
    spacing: { after: 120 },
    indent: { left: convertInchesToTwip(0.3) },
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: "Consolas", color: "2d2d2d" })],
    spacing: { after: 20 },
  });
}

// ── Build Document ────────────────────────────────────────────────────────────

const children = [];
const add = (...items) => children.push(...items);

// COVER PAGE
add(spacer(), spacer(), spacer(), spacer());
add(title("RAKSHA AI"));
add(subtitle("AI-Powered Digital Public Safety Intelligence Platform"));
add(spacer());
add(new Paragraph({ children: [new TextRun({ text: "ET AI Hackathon 2.0 — Phase 2 Prototype", size: 32, color: "e94560", bold: true, font: "Segoe UI" })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
add(new Paragraph({ children: [new TextRun({ text: "Problem Statement 6: AI for Digital Public Safety", size: 26, color: "4a4a6a", font: "Segoe UI" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
add(new Paragraph({ children: [new TextRun({ text: "Defeating Counterfeiting, Fraud & Digital Arrest Scams", size: 24, color: "16213e", font: "Segoe UI", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
add(new Paragraph({ children: [new TextRun({ text: "Comprehensive Implementation Plan & Technical Architecture", size: 22, color: "666666", font: "Segoe UI" })], alignment: AlignmentType.CENTER }));
add(new Paragraph({ children: [new TextRun({ text: "Version 2.0 | July 2026 | Latest Compatible Versions", size: 22, color: "666666", font: "Segoe UI" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
add(spacer(), spacer());
add(new Paragraph({ children: [new TextRun({ text: "Team: Jason James Gonsalves & Team", size: 24, color: "1a1a2e", bold: true, font: "Segoe UI" })], alignment: AlignmentType.CENTER }));
add(pb());

// TABLE OF CONTENTS
add(h1("Table of Contents"), spacer());
const tocItems = [
  "1. Executive Summary",
  "2. Platform Vision — RAKSHA AI",
  "3. Complete Tech Stack (Latest Compatible Versions)",
  "4. System Architecture Overview",
  "5. AI Agent Architecture & Inter-Agent Communication",
  "6. Module 1: SENTINEL — Digital Arrest Scam Detection",
  "7. Module 2: NETRA — Counterfeit Currency Identification",
  "8. Module 3: JAAL — Fraud Network Graph Intelligence",
  "9. Module 4: DRISHTI — Geospatial Crime Pattern Intelligence",
  "10. Module 5: KAVACH — Citizen Fraud Shield",
  "11. Novel Features — Our Differentiators",
  "12. Web Simulation Strategy",
  "13. Data Storage & Sharing Architecture",
  "14. Database Schema Design",
  "15. API Design & Endpoints",
  "16. Authentication & Authorization",
  "17. Real-Time Infrastructure",
  "18. Deployment Architecture",
  "19. Evaluation Metrics & Benchmarks",
  "20. Demo Strategy & Presentation Plan",
  "Appendix A: Project Folder Structure",
  "Appendix B: Implementation Timeline",
  "Appendix C: Environment Variables",
];
tocItems.forEach((item) => add(new Paragraph({ children: [new TextRun({ text: item, size: 22, font: "Segoe UI", color: "0f3460" })], spacing: { after: 80 }, indent: { left: convertInchesToTwip(0.3) } })));
add(pb());

// 1. EXECUTIVE SUMMARY
add(h1("1. Executive Summary"), spacer());
add(para("RAKSHA AI is a comprehensive, AI-powered Digital Public Safety Intelligence Platform designed to combat India's escalating cybercrime crisis. With 1.14 million cybercrime complaints registered in 2023 (up 60% from 2022) and digital arrest scams defrauding citizens of over Rs 1,776 crore in the first nine months of 2024 alone, there is an urgent need for a proactive, intelligence-first approach to digital safety."));
add(spacer());
add(para('Our platform shifts the paradigm from reactive case investigation to predictive threat neutralisation. RAKSHA AI ("Raksha" meaning "protection" in Hindi) integrates five interconnected AI modules — each powered by specialised AI agents that communicate, share intelligence, and act in concert — to deliver a unified command-and-control experience for law enforcement, financial institutions, and citizens.'));
add(spacer());
add(h3("Core Value Proposition"));
add(bullet("Real-time detection of digital arrest scams during active sessions — before financial transfer occurs"));
add(bullet("Instant counterfeit currency identification through advanced computer vision — deployable on any device"));
add(bullet("Graph-based fraud network intelligence that maps entire criminal operations across jurisdictions"));
add(bullet("Geospatial crime pattern analysis with predictive hotspot modelling for resource deployment"));
add(bullet("Multi-channel citizen protection shield with conversational AI in 12+ regional languages"));
add(spacer());
add(h3("Key Differentiators"));
add(bullet("Multi-Agent Orchestration Engine — agents share context and escalate threats autonomously"));
add(bullet("Simulated real-time call/video analysis within a web interface for demo and training"));
add(bullet("Court-admissible evidence packaging with blockchain-anchored audit trails"));
add(bullet("Federated learning for privacy-preserving model improvement across agencies"));
add(bullet("Dark web intelligence scraping for proactive threat detection"));
add(bullet("Deepfake detection in real-time video streams using multimodal analysis"));
add(pb());

// 2. PLATFORM VISION
add(h1("2. Platform Vision — RAKSHA AI"), spacer());
add(para("RAKSHA stands for: Real-time Analysis, Knowledge-graph intelligence, Scam Hunting, and Holistic Alerting."));
add(spacer());
add(h3("2.1 Mission Statement"));
add(para("To equip law enforcement agencies, financial institutions, and citizens with proactive, AI-driven tools that detect, disrupt, and respond to digital fraud networks, counterfeit currency circulation, and organised scam operations — shifting India from a reactive complaint-based system to a predictive intelligence-driven safety ecosystem."));
add(spacer());
add(h3("2.2 User Personas & Roles"), spacer());
add(makeTable(["User Persona", "Description", "Key Features Access"], [
  ["Law Enforcement Officer (LEO)", "Police officers, cybercrime cell investigators, intelligence analysts", "Full dashboard, graph intelligence, geospatial maps, evidence packages, alert management"],
  ["Bank Operations Manager", "Branch managers, currency verification officers, compliance teams", "Counterfeit detection tool, transaction anomaly alerts, fraud network feeds"],
  ["Citizen (General Public)", "Any Indian citizen targeted by scammers", "Fraud Shield chatbot, scam checker, report filing, safety advisories"],
  ["Command Centre Operator", "Senior LEOs operating district/state command centres", "Full geospatial dashboard, resource deployment, inter-agency coordination"],
  ["System Administrator", "Platform administrators", "User management, model monitoring, system health, audit logs"],
  ["Telecom Operator", "Telco fraud detection teams", "API-based alert feeds, number flagging, CDR analysis integration"],
]));
add(spacer());
add(h3("2.3 Platform Modules Overview"), spacer());
add(makeTable(["Module", "Codename", "Primary AI Capabilities", "Target Users"], [
  ["Digital Arrest Scam Detection", "SENTINEL", "NLP, Speech AI, Video Analysis, Pattern Recognition", "LEOs, Telecom, Citizens"],
  ["Counterfeit Currency ID", "NETRA", "Computer Vision, CNN, Edge AI", "Banks, LEOs, Citizens"],
  ["Fraud Network Graph", "JAAL", "Graph Neural Networks, Link Prediction, Community Detection", "LEOs, Financial Institutions"],
  ["Geospatial Intelligence", "DRISHTI", "Geospatial AI, Clustering, Predictive Analytics", "Command Centres, LEOs"],
  ["Citizen Fraud Shield", "KAVACH", "Conversational AI, Multilingual NLP, Intent Detection", "Citizens"],
]));
add(pb());

// 3. TECH STACK
add(h1("3. Complete Tech Stack (Latest Compatible Versions — July 2026)"), spacer());
add(notePara("All versions below are the latest stable releases as of July 2026, validated for mutual compatibility."));
add(spacer());

add(h3("3.1 Frontend"), spacer());
add(makeTable(["Technology", "Version", "Purpose"], [
  ["Next.js (App Router)", "15.3.x", "Primary web framework — SSR/SSG, RSC, streaming, middleware"],
  ["React", "19.1.x", "UI library — concurrent features, React Compiler support"],
  ["TypeScript", "5.7.x", "Type-safe development"],
  ["Tailwind CSS", "4.1.x", "Utility CSS — Oxide engine (Rust), CSS-first config"],
  ["shadcn/ui", "Latest CLI", "Accessible, beautiful component collection"],
  ["Framer Motion", "12.x", "Animations & transitions"],
  ["Recharts", "2.15.x", "Charts and statistical visualisations"],
  ["@nivo/core suite", "0.90.x", "Advanced data viz (heatmaps, network graphs)"],
  ["deck.gl", "9.2.x", "High-performance WebGL geospatial rendering"],
  ["Mapbox GL JS", "3.10.x", "Interactive maps, geocoding, routes"],
  ["@xyflow/react (React Flow)", "12.6.x", "Interactive node-edge graph visualisation"],
  ["Socket.io Client", "4.8.x", "Real-time updates via WebSocket"],
  ["PeerJS", "1.5.x", "WebRTC for video call simulation"],
  ["react-webcam", "7.2.x", "Camera integration for currency scanning"],
  ["i18next + react-i18next", "24.x / 15.x", "Internationalisation (12+ Indian languages)"],
  ["Zustand", "5.0.x", "Lightweight global state management"],
  ["TanStack Query", "5.70.x", "Server state caching & sync"],
]));
add(spacer());

add(h3("3.2 Backend"), spacer());
add(makeTable(["Technology", "Version", "Purpose"], [
  ["FastAPI", "0.115.x", "Async API server — OpenAPI docs, Pydantic v2"],
  ["Python", "3.12.x", "Runtime — performance improvements, better typing"],
  ["Pydantic", "2.11.x", "Data validation — Rust-core, 5-50x faster than v1"],
  ["Uvicorn", "0.34.x", "Production ASGI server"],
  ["Celery", "5.5.x", "Task queue for heavy AI inference"],
  ["LangChain", "0.3.x", "Agent orchestration, tool use, structured output"],
  ["LangGraph", "0.4.x", "Stateful multi-agent state machines"],
  ["CrewAI", "0.105.x", "Multi-agent collaboration with roles & delegation"],
  ["python-socketio", "5.12.x", "WebSocket server for real-time comms"],
]));
add(spacer());

add(h3("3.3 AI/ML Models & Libraries"), spacer());
add(makeTable(["Model/Library", "Version", "Module", "Purpose"], [
  ["HuggingFace Transformers", "4.48.x", "All", "NLP/Vision model loading & fine-tuning"],
  ["PyTorch", "2.6.x", "All", "Deep learning framework (CUDA 12.6)"],
  ["Faster-Whisper", "1.1.x", "SENTINEL", "CTranslate2-optimised Whisper (4x faster)"],
  ["IndicBERT / MuRIL", "Latest HF", "SENTINEL, KAVACH", "Multilingual Indian language NLP"],
  ["wav2vec 2.0 / SpeechBrain", "1.0.x", "SENTINEL", "Voice spoofing & AI-voice detection"],
  ["pyannote-audio", "3.3.x", "SENTINEL", "Speaker diarisation"],
  ["EfficientNet-V2", "torchvision", "NETRA", "Currency image classification"],
  ["Ultralytics YOLOv11", "8.3.x", "NETRA", "Security feature detection"],
  ["SAM 2 (Segment Anything)", "Latest HF", "NETRA", "Precise feature segmentation"],
  ["OpenCV", "4.11.x", "NETRA", "Image preprocessing"],
  ["PaddleOCR", "2.9.x", "NETRA", "Serial number OCR"],
  ["PyTorch Geometric", "2.6.x", "JAAL", "Graph Neural Networks"],
  ["NetworkX", "3.4.x", "JAAL", "Graph analytics"],
  ["scikit-learn", "1.6.x", "DRISHTI", "HDBSCAN clustering"],
  ["Prophet", "1.1.x", "DRISHTI", "Time-series forecasting"],
  ["Rasa Open Source", "3.6.x", "KAVACH", "Conversational AI engine"],
  ["LLaMA 3.1 (8B quantised)", "HF GGUF", "All", "LLM backbone for reasoning"],
  ["Sentence Transformers", "3.4.x", "All", "Semantic embeddings & similarity"],
  ["DeepFace", "0.0.93+", "SENTINEL", "Deepfake detection"],
  ["MediaPipe", "0.10.x", "SENTINEL", "Face mesh, liveness detection"],
  ["IndicTrans2 (AI4Bharat)", "Latest HF", "All", "Indian language translation"],
]));
add(spacer());

add(h3("3.4 Databases & Storage"), spacer());
add(makeTable(["Technology", "Tier", "Purpose", "Data Stored"], [
  ["Supabase (PostgreSQL 16)", "Free", "Primary relational DB", "Users, cases, reports, evidence, audit logs"],
  ["Upstash Vector", "Free", "Vector similarity search", "Scam embeddings, fraud patterns, semantic index"],
  ["Upstash Redis", "Free", "Caching & real-time", "Sessions, rate limiting, alert queues, pub/sub"],
  ["Firebase Auth", "Spark (Free)", "Authentication", "User sessions, OAuth, RBAC"],
  ["Firebase Storage", "Spark (Free)", "File storage", "Currency images, recordings, evidence"],
  ["Neo4j AuraDB", "Free", "Graph database", "Fraud network graphs (nodes, edges, communities)"],
]));
add(spacer());

add(h3("3.5 External APIs & Services"), spacer());
add(makeTable(["Service", "Purpose", "Integration Point"], [
  ["SERP API", "Web intelligence gathering", "Phone number reputation, scam databases, dark web proxy"],
  ["Authkey.io", "SMS & Voice Alerts", "SMS alerts, IVR simulation, voice reporting"],
  ["Mapbox API", "Geospatial mapping", "Crime maps, geocoding, patrol route optimisation"],
  ["HuggingFace Inference API", "Model serving", "Serverless inference for lighter models"],
]));
add(spacer());

add(h3("3.6 Version Compatibility Matrix"), spacer());
const compat = [
  "Next.js 15.3 <-- requires --> React 19.1, Node.js >= 20.x",
  "Tailwind CSS 4.1 <-- requires --> PostCSS 8.5+, Node.js >= 20.x",
  "FastAPI 0.115 <-- requires --> Pydantic 2.11, Python >= 3.10",
  "PyTorch 2.6 <-- requires --> Python 3.9-3.12, CUDA 12.6 (GPU)",
  "LangChain 0.3 <-- requires --> Pydantic 2.x, Python >= 3.9",
  "LangGraph 0.4 <-- requires --> LangChain 0.3.x",
  "Ultralytics 8.3 <-- requires --> PyTorch >= 2.0, Python >= 3.8",
];
compat.forEach(l => add(code(l)));
add(pb());

// 4. SYSTEM ARCHITECTURE
add(h1("4. System Architecture Overview"), spacer());
add(h3("4.1 High-Level Architecture (3-Tier)"));
add(boldPara("Tier 1 — Presentation Layer (Next.js 15): ", "Handles all user interactions, dashboard rendering, real-time visualisations, and simulated call/video interfaces. Communicates with backend via REST APIs and WebSocket."));
add(spacer());
add(boldPara("Tier 2 — Intelligence Layer (FastAPI + AI Agents): ", "Five specialised AI agent clusters (SENTINEL, NETRA, JAAL, DRISHTI, KAVACH) operate semi-autonomously, each with tools, memory, and inter-agent communication. BRAHMA orchestrator coordinates cross-module intelligence."));
add(spacer());
add(boldPara("Tier 3 — Data Layer (Supabase + Upstash + Neo4j): ", "Structured data (PostgreSQL), vector embeddings (Upstash Vector), graph relationships (Neo4j), real-time state (Redis), binary assets (Firebase Storage)."));
add(spacer());
add(h3("4.2 Microservice Decomposition"), spacer());
add(makeTable(["Service", "Port", "Responsibilities"], [
  ["api-gateway", "8000", "Request routing, rate limiting, auth verification"],
  ["sentinel-service", "8001", "Scam detection, call analysis, alerts"],
  ["netra-service", "8002", "Currency analysis, feature extraction, verdict"],
  ["jaal-service", "8003", "Graph construction, fraud rings, evidence"],
  ["drishti-service", "8004", "Geospatial analysis, hotspots, patrol optimisation"],
  ["kavach-service", "8005", "Chatbot, multilingual NLP, citizen interaction"],
  ["brahma-orchestrator", "8006", "Inter-agent coordination, intelligence fusion"],
  ["worker-service", "—", "Celery workers for async GPU inference"],
]));
add(notePara("For Prototype: All services run as a single FastAPI monolith with modular routers."));
add(pb());

// 5. AI AGENT ARCHITECTURE
add(h1("5. AI Agent Architecture & Inter-Agent Communication"), spacer());
add(para("Each module is powered by specialised AI agents following the ReAct (Reasoning + Acting) pattern via LangGraph. Agents communicate via Redis pub/sub with structured event payloads."));
add(spacer());

add(h3("5.1 Agent Definitions"), spacer());
const agents = [
  ["SENTINEL", "Real-time digital arrest scam detection and alerting", "Faster-Whisper STT, IndicBERT classifier, wav2vec voice analyser, video frame extractor, alert generator", "Scam probability (0-1), scam type, evidence snapshot, alert payload"],
  ["NETRA", "Analyse currency images, identify counterfeits with explanations", "EfficientNet-V2 classifier, YOLOv11 detector, OpenCV preprocessor, PaddleOCR", "Real/Fake verdict, confidence %, anomalies, annotated image"],
  ["JAAL", "Build and analyse fraud network graphs", "Neo4j queries, PyG GNN models, community detection, evidence packager", "Network visualisation, key actors, money flows, evidence packages"],
  ["DRISHTI", "Map crime patterns, predict hotspots, optimise patrols", "HDBSCAN clustering, Prophet forecasting, Mapbox renderer, route optimiser", "Heatmaps, hotspot alerts, risk zones, patrol routes"],
  ["KAVACH", "Conversational AI for citizen fraud assessment", "Rasa dialog engine, IndicBERT classifier, NCRB formatter, language detector", "Fraud verdict, guided report, NCRB draft, LEO escalation"],
  ["BRAHMA", "Coordinate inter-agent intelligence sharing", "Message bus publisher, priority queue, cross-reference engine", "Unified briefings, cross-module alerts, investigation threads"],
];
agents.forEach(([name, role, tools, outputs]) => {
  add(h4(`${name} Agent`));
  add(bulletBold("Role: ", role));
  add(bulletBold("Tools: ", tools));
  add(bulletBold("Outputs: ", outputs));
  add(spacer());
});

add(h3("5.2 Inter-Agent Communication Protocol"), spacer());
add(para("Message Format (Redis Pub/Sub):"));
add(bullet("event_type: SCAM_DETECTED | COUNTERFEIT_FOUND | NETWORK_UPDATED | HOTSPOT_ALERT | CITIZEN_REPORT"));
add(bullet("source_agent: Agent ID (e.g., 'sentinel-001')"));
add(bullet("target_agent: 'broadcast' | specific agent ID"));
add(bullet("priority: CRITICAL | HIGH | MEDIUM | LOW"));
add(bullet("payload: JSON with detection details, confidence, evidence references"));
add(bullet("correlation_id: UUID linking related events across agents"));
add(pb());

// 6-10. MODULES (consolidated for docx brevity with full detail)
// MODULE 6: SENTINEL
add(h1("6. SENTINEL — Digital Arrest Scam Detection"), spacer());
add(para("Digital arrest scams defrauded citizens of Rs 1,776 crore in 2024's first 9 months. SENTINEL detects these scams in real-time through a 6-stage pipeline."));
add(spacer());
add(h3("Detection Pipeline"));
add(h4("Stage 1: Input Ingestion"));
add(bullet("Web simulation of phone/video calls, text input, CDR upload"));
add(h4("Stage 2: Speech-to-Text (Faster-Whisper)"));
add(bullet("4x faster than vanilla Whisper, 2-3 sec latency, pyannote speaker diarisation"));
add(h4("Stage 3: Scam Pattern Classification"));
add(bullet("Layer 1: IndicBERT intent detection (INTIMIDATION, URGENCY, IMPERSONATION, MONEY_DEMAND, etc.)"));
add(bullet("Layer 2: Sentence Transformer script matching (cosine similarity > 0.82 vs Upstash Vector)"));
add(bullet("Layer 3: Time-series behavioural analysis (escalation patterns, coercion cycles)"));
add(bullet("Layer 4: SERP API number reputation lookup"));
add(h4("Stage 4: Voice Analysis"));
add(bullet("wav2vec 2.0 synthetic voice detection, stress analysis, accent profiling"));
add(h4("Stage 5: Video Analysis"));
add(bullet("DeepFace deepfake detection, YOLOv11 uniform verification, background classification"));
add(h4("Stage 6: Threat Scoring"));
add(bullet("> 70: HIGH RISK (immediate alerts), 40-70: MEDIUM, < 40: LOW"));
add(bullet("Alerts via WebSocket, Authkey.io SMS, push notification"));
add(spacer());
add(h3("Web Simulation"));
add(bullet("Phone Call: Split-screen UI, pre-recorded scenarios, real-time transcript + scam gauge"));
add(bullet("Video Call: Webcam/upload with deepfake analysis overlay (face mesh, lip sync, uniform detection)"));
add(pb());

// MODULE 7: NETRA
add(h1("7. NETRA — Counterfeit Currency Identification"), spacer());
add(para("RBI 2025 report flagged record FICN seizures. NETRA brings AI detection to any smartphone camera."));
add(spacer());
add(h3("Detection Pipeline"));
add(h4("Stage 1: Preprocessing"));
add(bullet("OpenCV: auto-rotation, perspective correction, histogram equalisation, denoising, bg removal"));
add(h4("Stage 2: Denomination Classification"));
add(bullet("EfficientNet-V2-S: Rs 10/20/50/100/200/500/2000 classification"));
add(h4("Stage 3: Security Feature Detection"));
add(makeTable(["Feature", "Method", "Denominations"], [
  ["Security Thread", "Object detection + pattern analysis", "All"],
  ["Watermark", "Template matching + SSIM", "Rs 100, 200, 500"],
  ["Micro Lettering", "High-res crop + OCR", "All"],
  ["Intaglio Printing", "Gabor filter texture analysis", "Rs 100, 200, 500"],
  ["Colour-shifting Ink", "Multi-angle colour analysis", "Rs 200, 500"],
  ["Bleed Lines", "Edge detection + pattern matching", "All"],
]));
add(h4("Stage 4: Serial Number Analysis"));
add(bullet("PaddleOCR extraction, regex validation, Upstash Vector pattern matching, duplicate detection"));
add(h4("Stage 5: Holistic Scoring"));
add(bullet("Weighted ensemble: features 40%, quality 30%, serial 15%, print consistency 15%"));
add(bullet("Verdict: AUTHENTIC / SUSPICIOUS / COUNTERFEIT with annotated explainability image"));
add(pb());

// MODULE 8: JAAL
add(h1("8. JAAL — Fraud Network Graph Intelligence"), spacer());
add(para("Modern scam operations are coordinated networks. JAAL uses Graph AI to map the criminal ecosystem."));
add(spacer());
add(h3("Graph Data Model"));
add(bullet("Node Types: Person, Phone, Bank Account, UPI ID, Device, IP, Transaction, Complaint, Location, Counterfeit Note"));
add(bullet("Edge Types: CALLED, TRANSFERRED_TO, OWNS, REPORTED_BY, ASSOCIATED_WITH, LOCATED_AT, PART_OF_NETWORK"));
add(spacer());
add(h3("Analytics Pipeline"));
add(bullet("1. Graph Construction: entity resolution via fuzzy matching, temporal edges"));
add(bullet("2. Community Detection: Louvain/Leiden algorithms for fraud cluster identification"));
add(bullet("3. Key Actor ID: betweenness centrality, PageRank, temporal burst detection"));
add(bullet("4. Link Prediction: GraphSAGE GNN for proactive unknown associate identification"));
add(bullet("5. Money Flow Tracing: shortest path analysis, flow aggregation, layering detection"));
add(bullet("6. Evidence Package: court-admissible report with network viz, actors, timeline, evidence chain"));
add(spacer());
add(h3("Web Interface — Graph Explorer"));
add(bullet("@xyflow/react force-directed graph with zoom, pan, filter, time slider"));
add(bullet("Node inspector, evidence export, entity search, time machine animation"));
add(pb());

// MODULE 9: DRISHTI
add(h1("9. DRISHTI — Geospatial Crime Pattern Intelligence"), spacer());
add(h3("Analytics Layers"));
add(makeTable(["Layer", "Algorithm", "Output"], [
  ["Heatmap", "Kernel Density Estimation", "Continuous crime surface, filterable by type/time"],
  ["Hotspot Detection", "HDBSCAN clustering", "Statistically significant clusters with profiles"],
  ["Predictive Risk", "Prophet forecasting", "Risk scores per grid cell for 24/48/72 hours"],
  ["Patrol Optimisation", "TSP variant", "Optimal routes maximising high-risk coverage"],
  ["Corridor Detection", "Serial pattern + JAAL flows", "Distribution corridors, inter-district movement"],
]));
add(spacer());
add(h3("Command Centre Dashboard"));
add(bullet("deck.gl + Mapbox full-screen map with toggleable layers"));
add(bullet("Live incident feed, hotspot details, patrol planner, time machine, district comparison"));
add(pb());

// MODULE 10: KAVACH
add(h1("10. KAVACH — Citizen Fraud Shield"), spacer());
add(h3("Channel Strategy"), spacer());
add(makeTable(["Channel", "Web Implementation", "Future"], [
  ["Web Chat", "Embedded chatbot widget (primary)", "Standalone app"],
  ["WhatsApp Sim", "Pixel-perfect UI with demo conversations", "WhatsApp Business API"],
  ["IVR Sim", "Phone keypad + audio prompts in browser", "Authkey.io IVR"],
  ["SMS", "Live via Authkey.io", "Already functional"],
  ["Mobile", "Responsive PWA", "Native React Native"],
]));
add(spacer());
add(h3("Core Intents"), spacer());
add(makeTable(["Intent", "Example", "Response"], [
  ["check_suspicious_call", "'Call from CBI, is it real?'", "Analyse vs scam patterns, verdict with confidence"],
  ["check_number", "'Is 9876543210 safe?'", "Query SENTINEL DB, risk score + history"],
  ["check_message", "'Is this SMS a scam?'", "NLP classification, fraud probability + advice"],
  ["report_fraud", "'How do I report?'", "Guided report, NCRB draft, helplines"],
  ["emergency", "'They have my bank details!'", "Freeze account steps, bank helplines, police"],
]));
add(spacer());
add(h3("Multilingual Support"));
add(bullet("Primary: Hindi, English. Phase 1: Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada"));
add(bullet("Phase 2: Malayalam, Punjabi, Odia, Assamese. Tech: IndicBERT + IndicTrans2"));
add(pb());

// 11. NOVEL FEATURES
add(h1("11. Novel Features — Our Differentiators"), spacer());
const novelFeatures = [
  ["11.1 Real-Time Deepfake Shield", "MediaPipe Face Mesh + temporal CNN + wav2vec AV alignment for real-time deepfake detection during simulated video calls. Liveness detection, temporal consistency, lip-sync analysis, identity verification."],
  ["11.2 Dark Web Intelligence Crawler", "SERP API for surface web + custom scrapers for indexed Telegram channels. Monitors leaked scam scripts, money mule ads, stolen identity sales, counterfeit vendors."],
  ["11.3 Scam Simulation Training Engine", "Interactive citizen training: 10+ scam scenarios, AI plays scammer, red flag highlights, scorecard with gamification (badges, leaderboards, certifications)."],
  ["11.4 Blockchain-Anchored Evidence Chain", "SHA-256 hashed evidence artifacts anchored to Polygon Amoy testnet. Timestamped, immutable, court-admissible with blockchain tx ID verification."],
  ["11.5 Federated Threat Intelligence", "Cross-agency intelligence sharing without raw data exposure. Federated model weights, anonymised threat indicators, privacy-preserving."],
  ["11.6 AI Evidence Summariser", "LLaMA 3.1 + RAG over case evidence. Generates FIR drafts, chargesheet summaries, prosecution briefs in English + Hindi."],
  ["11.7 Predictive Victim Identification", "Demographic + behavioural pattern analysis. Proactive SMS outreach to high-risk groups. Privacy-first: aggregate stats only."],
  ["11.8 Real-Time Translation Engine", "IndicTrans2 for cross-language intelligence. Tamil scam call auto-analysed in English. Cross-language scam pattern matching."],
  ["11.9 Citizen Trust Score", "Government channel verification. Citizens can verify 'Did CBI call from this number?' QR code verification, callback verification via KAVACH."],
  ["11.10 Transaction Anomaly Detection", "Isolation Forest / Autoencoder on transaction patterns. Auto-ingested into JAAL graph. Bank alert API for direct integration."],
];
novelFeatures.forEach(([title, desc]) => {
  add(h3(title));
  add(para(desc));
  add(spacer());
});
add(pb());

// 12. WEB SIMULATION
add(h1("12. Web Simulation Strategy"), spacer());
add(para("All real-world interactions are convincingly simulated in-browser for the web app prototype."));
add(spacer());
add(makeTable(["Simulation", "Implementation", "Key Tech"], [
  ["Phone Call", "Split-screen UI, pre-recorded scenarios, mic capture, real-time transcript + scam gauge", "Web Audio API, WebSocket"],
  ["Video Call", "Split-screen webcam + pre-recorded video, deepfake analysis overlay", "WebRTC via PeerJS"],
  ["WhatsApp", "Pixel-perfect WhatsApp UI, messages routed to KAVACH backend", "React components"],
  ["IVR", "Phone keypad UI, audio prompts in 4 languages, DTMF/voice input", "Web Audio API, Whisper"],
  ["SMS Alert", "Live SMS via Authkey.io + phone notification mockup in UI", "Authkey.io API"],
  ["Command Centre", "Full-screen multi-panel dashboard, simulated real-time event stream", "deck.gl, WebSocket"],
]));
add(pb());

// 13. DATA STORAGE
add(h1("13. Data Storage & Sharing Architecture"), spacer());
add(h3("Three Data Sharing Mechanisms"), spacer());
add(makeTable(["Mechanism", "Technology", "Use Case"], [
  ["Shared Database", "Supabase PostgreSQL", "Persistent data via foreign keys, module schema namespaces"],
  ["Event Bus", "Upstash Redis Pub/Sub", "Real-time alerts, cross-module triggers, dashboard updates"],
  ["Vector Store", "Upstash Vector", "Semantic similarity across scam scripts, fraud patterns, queries"],
]));
add(spacer());
add(h3("Cross-Module Data Flow Examples"));
add(boldPara("SENTINEL -> JAAL: ", "Scam detected -> Supabase write -> Redis SCAM_DETECTED -> JAAL checks Neo4j -> enriches/creates fraud network nodes"));
add(boldPara("NETRA -> DRISHTI: ", "Counterfeit found with GPS -> Supabase write -> Redis COUNTERFEIT_DETECTED -> DRISHTI spatial update -> hotspot check -> command centre alert"));
add(boldPara("KAVACH -> SENTINEL: ", "Citizen reports suspicious call -> KAVACH extracts details -> SENTINEL analyses -> risk assessment returned -> emergency SMS if HIGH"));
add(pb());

// 14-17 consolidated
add(h1("14. Database Schema Design"), spacer());
add(para("All tables use UUID PKs, timestamps, and Supabase Row Level Security (RLS). Full schema detailed in the .md implementation plan."));
add(spacer());
add(h3("Key Tables by Module"), spacer());
add(makeTable(["Module", "Key Tables"], [
  ["Shared", "users, audit_logs, notifications, cases, case_evidence"],
  ["SENTINEL", "sessions, transcripts, voice_analyses, video_analyses, alerts, scam_numbers"],
  ["NETRA", "scans, feature_results, serial_numbers, counterfeit_patterns"],
  ["JAAL", "communities, evidence_packages, entity_metadata (+ Neo4j graph data)"],
  ["DRISHTI", "incidents, hotspots, predictions, patrol_plans"],
  ["KAVACH", "sessions, messages, reports, number_checks"],
]));
add(pb());

add(h1("15-17. API, Auth & Real-Time Infrastructure"), spacer());
add(h3("API Architecture"));
add(bullet("Base: /api/v1/, Firebase JWT auth, Upstash Redis rate limiting"));
add(bullet("Response: { success, data, error, meta }, cursor-based pagination"));
add(spacer());
add(h3("WebSocket Endpoints"), spacer());
add(makeTable(["Endpoint", "Purpose"], [
  ["/ws/sentinel/stream", "Real-time call/video analysis"],
  ["/ws/drishti/live", "Live map incident updates"],
  ["/ws/kavach/chat", "Real-time chatbot"],
  ["/ws/dashboard/feed", "Unified dashboard feed"],
  ["/ws/jaal/graph-updates", "Live graph changes"],
]));
add(spacer());
add(h3("RBAC Roles"), spacer());
add(makeTable(["Role", "Permissions"], [
  ["citizen", "KAVACH, currency scan, number check, reports, personal dashboard"],
  ["leo", "Full SENTINEL, JAAL explorer, DRISHTI maps, evidence, cases"],
  ["bank", "NETRA batch scanning, transaction alerts, fraud feeds (read-only)"],
  ["command_centre", "All LEO + command centre + patrol + inter-agency"],
  ["admin", "All + user management + model monitoring + system config + audits"],
]));
add(pb());

// 18. DEPLOYMENT
add(h1("18. Deployment Architecture"), spacer());
add(makeTable(["Component", "Platform", "Tier"], [
  ["Next.js Frontend", "Vercel", "Hobby (Free)"],
  ["FastAPI Backend", "Railway", "Starter ($5/mo)"],
  ["Supabase", "Supabase Cloud", "Free"],
  ["Upstash Vector + Redis", "Upstash", "Free"],
  ["Neo4j", "Neo4j AuraDB", "Free"],
  ["Firebase Auth + Storage", "Firebase", "Spark (Free)"],
  ["HuggingFace Models", "HF Inference API", "Free"],
]));
add(pb());

// 19. METRICS
add(h1("19. Evaluation Metrics & Benchmarks"), spacer());
add(makeTable(["Module", "Key Metric", "Target"], [
  ["SENTINEL", "Scam Detection Precision / Recall", "> 92% / > 88%"],
  ["SENTINEL", "False Positive Rate", "< 5%"],
  ["SENTINEL", "Detection Latency", "< 30 seconds"],
  ["NETRA", "Counterfeit Detection Accuracy", "> 95%"],
  ["NETRA", "False Positive Rate", "< 3%"],
  ["NETRA", "Inference Time", "< 3 seconds"],
  ["JAAL", "Network Detection Recall", "> 85%"],
  ["JAAL", "Lead Time Before Mass Victimisation", "> 24 hours"],
  ["DRISHTI", "Hotspot Detection F1", "> 0.80"],
  ["DRISHTI", "Prediction Accuracy (24h)", "> 75%"],
  ["KAVACH", "Intent Detection Accuracy", "> 90%"],
  ["KAVACH", "Response Latency", "< 2 seconds"],
]));
add(pb());

// 20. DEMO STRATEGY
add(h1("20. Demo Strategy & Presentation Plan"), spacer());
add(makeTable(["Segment", "Duration", "Content"], [
  ["Opening", "2 min", "Problem context, RAKSHA AI intro, architecture"],
  ["SENTINEL Demo", "3 min", "Hindi CBI scam call, live transcript, scam gauge, SMS alert"],
  ["NETRA Demo", "2 min", "Live scan (authentic), upload counterfeit, feature analysis"],
  ["JAAL Demo", "2 min", "50+ node graph, community detection, evidence package"],
  ["DRISHTI Demo", "2 min", "Mumbai heatmap, layers, predictive zones, patrol routes"],
  ["KAVACH Demo", "2 min", "Live chat, WhatsApp sim, Hindi, IVR demo"],
  ["Cross-Module", "1 min", "SENTINEL -> JAAL -> DRISHTI -> KAVACH cascade"],
  ["Closing", "1 min", "Impact metrics, scalability, roadmap"],
]));
add(pb());

// APPENDIX A: FOLDER STRUCTURE
add(h1("Appendix A: Project Folder Structure"), spacer());
const structure = [
  "raksha-ai/",
  "|-- frontend/                    # Next.js 15.3 App",
  "|   |-- app/                     # App Router pages",
  "|   |   |-- (auth)/              # Login, Register",
  "|   |   |-- dashboard/           # Main dashboard",
  "|   |   |-- sentinel/            # Scam detection (analyse, alerts, simulate)",
  "|   |   |-- netra/               # Currency scanner (scan, history)",
  "|   |   |-- jaal/                # Graph intelligence (explorer, evidence)",
  "|   |   |-- drishti/             # Geospatial (map, command centre)",
  "|   |   |-- kavach/              # Citizen shield (chat, whatsapp, ivr)",
  "|   |   |-- admin/               # Admin panel",
  "|   |-- components/              # Shared components (ui, charts, maps, graphs, simulation)",
  "|   |-- lib/                     # api.ts, firebase.ts, supabase.ts, websocket.ts",
  "|   |-- hooks/                   # Custom React hooks",
  "|   |-- stores/                  # Zustand state stores",
  "|-- backend/                     # FastAPI Application",
  "|   |-- app/main.py              # Entry point",
  "|   |-- app/routes/              # sentinel.py, netra.py, jaal.py, drishti.py, kavach.py",
  "|   |-- app/agents/              # Agent definitions + brahma_orchestrator.py",
  "|   |-- app/ml/                  # ML model wrappers",
  "|   |-- app/db/                  # supabase.py, neo4j.py, upstash_vector.py, upstash_redis.py",
  "|   |-- app/workers/             # Celery task definitions",
  "|   |-- scripts/                 # seed_data.py, train_models.py",
  "|-- docker-compose.yml           # Local dev setup",
  "|-- .github/workflows/           # CI/CD pipelines",
];
structure.forEach(l => add(code(l)));
add(pb());

// APPENDIX B: TIMELINE
add(h1("Appendix B: Implementation Timeline"), spacer());
add(para("Deadline: 22 July 2026. Available: ~8 days remaining."));
add(spacer());
add(makeTable(["Day", "Tasks", "Deliverables"], [
  ["Day 1", "Scaffolding: Next.js 15 + FastAPI + DBs + Firebase Auth + env config", "Running frontend + backend with auth"],
  ["Day 2", "SENTINEL: Faster-Whisper, scam classifier, call simulation UI", "Working scam detection"],
  ["Day 3", "NETRA: EfficientNet, YOLOv11, camera UI, preprocessing", "Working counterfeit scanner"],
  ["Day 4", "KAVACH: Rasa chatbot, core intents, chat + WhatsApp UI", "Working chatbot (8+ intents)"],
  ["Day 5", "JAAL: Neo4j, graph model, @xyflow/react viz, community detection", "Working fraud network explorer"],
  ["Day 6", "DRISHTI: deck.gl/Mapbox, heatmap, hotspots, command centre UI", "Working geospatial dashboard"],
  ["Day 7", "BRAHMA + novel features (deepfake, training engine, summariser)", "Cross-module + 3 novel features"],
  ["Day 8", "Demo prep: seed data, scripts, deck, video, polish", "Complete demo-ready prototype"],
]));
add(pb());

// APPENDIX C: ENV VARS
add(h1("Appendix C: Environment Variables"), spacer());
const envVars = [
  "# Firebase",
  "NEXT_PUBLIC_FIREBASE_API_KEY=",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID=",
  "FIREBASE_ADMIN_SDK_KEY=",
  "",
  "# Supabase",
  "NEXT_PUBLIC_SUPABASE_URL=",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=",
  "SUPABASE_SERVICE_ROLE_KEY=",
  "",
  "# Upstash Vector",
  "UPSTASH_VECTOR_REST_URL=",
  "UPSTASH_VECTOR_REST_TOKEN=",
  "",
  "# Upstash Redis",
  "UPSTASH_REDIS_REST_URL=",
  "UPSTASH_REDIS_REST_TOKEN=",
  "",
  "# Neo4j",
  "NEO4J_URI=",
  "NEO4J_USERNAME=",
  "NEO4J_PASSWORD=",
  "",
  "# External APIs",
  "SERP_API_KEY=",
  "AUTHKEY_API_KEY=",
  "MAPBOX_ACCESS_TOKEN=",
  "HUGGINGFACE_API_TOKEN=",
  "",
  "# FastAPI",
  "FASTAPI_SECRET_KEY=",
  "FASTAPI_DEBUG=true",
  "CELERY_BROKER_URL=redis://localhost:6379/0",
];
envVars.forEach(l => add(code(l)));
add(spacer(), spacer());

// CLOSING
add(new Paragraph({ children: [new TextRun({ text: "— End of Implementation Plan —", size: 28, color: "0f3460", bold: true, font: "Segoe UI", italics: true })], alignment: AlignmentType.CENTER, spacing: { before: 400 } }));
add(new Paragraph({ children: [new TextRun({ text: "RAKSHA AI — Protecting India's Digital Future", size: 22, color: "e94560", font: "Segoe UI" })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

// ── Generate ──────────────────────────────────────────────────────────────────

const doc = new Document({
  title: "RAKSHA AI — Implementation Plan v2.0",
  description: "Comprehensive implementation plan for ET AI Hackathon 2.0 Phase 2 prototype — latest compatible versions",
  creator: "Jason James Gonsalves & Team",
  styles: { default: { document: { run: { font: "Segoe UI", size: 22 } } } },
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT },
      ],
    }],
  },
  sections: [{ properties: {}, children }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("RAKSHA_AI_Implementation_Plan_v2.docx", buffer);
  console.log("Done! RAKSHA_AI_Implementation_Plan_v2.docx generated successfully!");
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
});
