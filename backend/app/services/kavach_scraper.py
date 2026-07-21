"""KAVACH Document Scraper — collects cybercrime/fraud awareness content.

Scrapes Indian government cybercrime portals, RBI advisories, and MHA
digital arrest warnings. Falls back to a rich built-in corpus so the
RAG pipeline works even without internet access.
"""
from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass, field
from typing import Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Document:
    id: str
    title: str
    content: str
    source: str
    category: str
    url: str = ""
    metadata: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Scrapers
# ---------------------------------------------------------------------------

def _safe_get(url: str, timeout: int = 10) -> Optional[BeautifulSoup]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return BeautifulSoup(r.text, "lxml")
    except Exception as exc:
        logger.warning("Scrape failed for %s: %s", url, exc)
        return None


def scrape_cybercrime_gov() -> list[Document]:
    docs: list[Document] = []
    urls = [
        ("https://cybercrime.gov.in/Webform/crime_Prevention.aspx", "prevention"),
        ("https://cybercrime.gov.in/Webform/Whatiscybercrime.aspx", "awareness"),
    ]
    for url, cat in urls:
        soup = _safe_get(url)
        if not soup:
            continue
        for tag in soup.find_all(["p", "li", "h2", "h3"]):
            text = tag.get_text(separator=" ", strip=True)
            if len(text) > 80:
                docs.append(Document(
                    id=f"cybergov_{cat}_{len(docs)}",
                    title=f"Cybercrime.gov.in — {cat}",
                    content=text,
                    source="cybercrime.gov.in",
                    category=cat,
                    url=url,
                ))
        time.sleep(0.5)
    return docs


def scrape_rbi_advisories() -> list[Document]:
    docs: list[Document] = []
    url = "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=22726"
    soup = _safe_get(url)
    if soup:
        for tag in soup.find_all(["p", "li"]):
            text = tag.get_text(separator=" ", strip=True)
            if len(text) > 80:
                docs.append(Document(
                    id=f"rbi_{len(docs)}",
                    title="RBI Advisory — Digital Fraud",
                    content=text,
                    source="rbi.org.in",
                    category="banking_fraud",
                    url=url,
                ))
    return docs


# ---------------------------------------------------------------------------
# Built-in corpus (always available, no network needed)
# ---------------------------------------------------------------------------

BUILTIN_CORPUS: list[dict] = [
    # ── Digital Arrest Scams ──────────────────────────────────────────────
    {
        "id": "da_001",
        "title": "What is a Digital Arrest Scam?",
        "category": "digital_arrest",
        "content": (
            "Digital arrest is a scam where fraudsters impersonate CBI, ED, Customs, "
            "Narcotics, or police officers and conduct fake video-call 'arrests'. They "
            "trap victims in multi-day hostage situations and extort crores of rupees. "
            "The MHA reported over ₹1,776 crore defrauded in just the first nine months "
            "of 2024. No government agency ever arrests anyone over a video call or "
            "WhatsApp. If you receive such a call, hang up immediately and call 1930."
        ),
    },
    {
        "id": "da_002",
        "title": "How to Identify a Digital Arrest Call",
        "category": "digital_arrest",
        "content": (
            "Red flags of a digital arrest scam: (1) Caller claims to be from CBI, ED, "
            "Customs, Narcotics, Income Tax, or Telecom Department. (2) They say your "
            "Aadhaar, bank account, or phone is linked to drug trafficking, money "
            "laundering, or terrorism. (3) They demand you stay on video call for hours "
            "or days. (4) They ask you not to tell family members. (5) They demand "
            "immediate bank transfer to 'clear your name'. None of these are real — "
            "Indian government agencies do not operate this way."
        ),
    },
    {
        "id": "da_003",
        "title": "What to Do If You Receive a Digital Arrest Call",
        "category": "digital_arrest",
        "content": (
            "If you receive a digital arrest call: Step 1 — Stay calm. Hang up the call "
            "immediately. Step 2 — Do NOT transfer any money under any circumstances. "
            "Step 3 — Do NOT share your Aadhaar, PAN, bank details, or OTP. Step 4 — "
            "Inform a trusted family member or friend. Step 5 — Call the National Cyber "
            "Crime Helpline 1930 immediately. Step 6 — File a complaint at "
            "cybercrime.gov.in. Step 7 — Visit the nearest police station if needed. "
            "Remember: no real officer will ask you to transfer money to 'prove your "
            "innocence'."
        ),
    },
    {
        "id": "da_004",
        "title": "Prime Minister Modi's Warning on Digital Arrest Scams",
        "category": "digital_arrest",
        "content": (
            "Prime Minister Narendra Modi addressed digital arrest scams in his Mann Ki "
            "Baat broadcast, calling it a 'big fraud' sweeping the country. He stated: "
            "'No government agency — CBI, police, ED, Income Tax — ever makes a video "
            "call for investigation or arrest. If you get such a call, do not be afraid. "
            "Stay alert. Inform your family. Call the cyber helpline 1930.' The "
            "government has set up I4C (Indian Cyber Crime Coordination Centre) to "
            "coordinate action against these fraudsters."
        ),
    },
    # ── UPI / Banking Fraud ───────────────────────────────────────────────
    {
        "id": "upi_001",
        "title": "UPI Payment Scams — How They Work",
        "category": "upi_fraud",
        "content": (
            "UPI scams are the most common digital fraud in India. Common types: "
            "(1) Collect Request Scam — fraudster sends a collect request saying 'approve "
            "to receive money' but it actually debits your account. Always remember: to "
            "RECEIVE money on UPI you do NOT need to enter your PIN. "
            "(2) Fake QR Code — scammer shares a QR code asking you to scan to receive "
            "payment. Scanning and paying sends money TO them. "
            "(3) Screen Mirroring Apps — fraudster asks you to install AnyDesk, "
            "TeamViewer, or QuickSupport to 'help' with UPI issues, then captures your "
            "UPI PIN and bank details. Never share your screen with strangers."
        ),
    },
    {
        "id": "upi_002",
        "title": "UPI Safety Tips",
        "category": "upi_fraud",
        "content": (
            "To stay safe on UPI: (1) Never enter your UPI PIN to receive money — PIN is "
            "only needed to SEND money. (2) Verify merchant name before every payment. "
            "(3) Never share OTP, UPI PIN, or bank account details with anyone. "
            "(4) Do not install screen-sharing apps at anyone's request. (5) Check the "
            "recipient's VPA (Virtual Payment Address) carefully for typos. "
            "(6) If you are defrauded, call 1930 within the first hour — banks can "
            "sometimes reverse transactions if reported quickly. (7) Enable transaction "
            "limits in your UPI app settings."
        ),
    },
    # ── OTP / KYC Fraud ──────────────────────────────────────────────────
    {
        "id": "otp_001",
        "title": "OTP and KYC Fraud",
        "category": "otp_kyc_fraud",
        "content": (
            "OTP fraud: Fraudsters call posing as bank officials or telecom companies "
            "and claim your KYC is expired. They ask you to share an OTP 'to verify' "
            "your account. Sharing the OTP gives them full access to your bank account "
            "or mobile wallet. RBI's rule: Your bank will NEVER ask for your OTP, "
            "password, or CVV over call or SMS. If anyone asks for an OTP, hang up and "
            "report to 1930. KYC can only be updated by visiting your bank branch in "
            "person or through the bank's official app."
        ),
    },
    {
        "id": "otp_002",
        "title": "SIM Swap Fraud",
        "category": "otp_kyc_fraud",
        "content": (
            "SIM swap fraud: Fraudsters collect your Aadhaar and PAN details (from data "
            "leaks or social engineering), then visit a mobile store and get a duplicate "
            "SIM issued on your number. Once they control your SIM, all OTPs for your "
            "bank accounts are delivered to them. Signs of SIM swap: your phone suddenly "
            "has no network even in coverage areas. If this happens, immediately call "
            "your telecom provider's 24x7 helpline and block the SIM. Then call 1930."
        ),
    },
    # ── Fake Loan / Investment ────────────────────────────────────────────
    {
        "id": "loan_001",
        "title": "Fake Loan App Scams",
        "category": "loan_fraud",
        "content": (
            "Fake loan apps are downloaded from unofficial sources and promise instant "
            "loans with no documents. They demand access to your contacts, gallery, and "
            "microphone. After disbursing a small loan, they charge exorbitant interest "
            "and fees, and harass borrowers by calling and messaging their contacts. "
            "Some apps never disburse the loan but steal processing fees. "
            "RBI-registered NBFCs are listed on rbi.org.in. Always verify if a lender "
            "is RBI-registered before sharing any personal information. Report fake loan "
            "apps to cybercrime.gov.in and the Google Play Store / Apple App Store."
        ),
    },
    {
        "id": "invest_001",
        "title": "Investment and Trading Scams",
        "category": "investment_fraud",
        "content": (
            "Investment scams typically start with an unsolicited WhatsApp message or "
            "Telegram invite to a 'trading group' where 'experts' show fabricated profit "
            "screenshots. They ask you to invest on a fake platform that shows high "
            "returns. When you try to withdraw, they demand 'taxes' or 'fees'. "
            "Types include: stock tip scams, crypto pump-and-dump, fake IPO schemes, "
            "Ponzi schemes. SEBI warning signs: promises of guaranteed returns above "
            "10%, pressure to invest immediately, unregistered advisors. Always check "
            "SEBI registration at sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes"
        ),
    },
    # ── Job / Part-time Scams ─────────────────────────────────────────────
    {
        "id": "job_001",
        "title": "Part-time Job and Task Scams",
        "category": "job_fraud",
        "content": (
            "Part-time job scams target students and homemakers looking for extra income. "
            "The scam works in phases: Phase 1 — they pay small amounts for simple tasks "
            "(liking YouTube videos, rating products) to build trust. Phase 2 — they "
            "introduce 'prepaid tasks' where you must deposit money to get bigger "
            "commissions. Phase 3 — they keep demanding more deposits and then vanish. "
            "Red flags: job offered via WhatsApp/Telegram, no physical office, requires "
            "upfront payment, promises Rs.500–5000 per hour. Legitimate companies never "
            "ask employees to pay to work. Report to 1930 immediately."
        ),
    },
    # ── Counterfeit Currency ──────────────────────────────────────────────
    {
        "id": "ficn_001",
        "title": "How to Identify Counterfeit Currency Notes",
        "category": "counterfeit_currency",
        "content": (
            "RBI security features to check on Rs.500 and Rs.2000 notes: "
            "(1) Security Thread — embedded thread with 'भारत' and 'RBI' visible when "
            "held to light. (2) Watermark — portrait of Gandhi visible when held up. "
            "(3) Latent Image — Rs.500/2000 numeral visible at 45-degree angle. "
            "(4) Intaglio Printing — raised print on Gandhi portrait, RBI seal, and "
            "guarantee clause — should feel rough to touch. (5) Colour-shifting Ink — "
            "the numeral in the lower right changes from green to blue when tilted. "
            "(6) See-through Register — the floral design on front and back align "
            "perfectly when held to light. (7) Micro-lettering — 'RBI' in tiny letters "
            "between Gandhi's portrait and the security thread. If a note fails multiple "
            "checks, do not accept it and report to the nearest bank or police station."
        ),
    },
    {
        "id": "ficn_002",
        "title": "What to Do If You Receive a Fake Note",
        "category": "counterfeit_currency",
        "content": (
            "If you suspect you have received a fake currency note: "
            "(1) Do not return it to the person who gave it — they may be the source. "
            "(2) Do not try to pass it on — possessing or circulating fake currency is "
            "an offense under Section 489 IPC, punishable with life imprisonment. "
            "(3) Take it to the nearest bank branch. Banks are required to impound "
            "suspected fake notes and issue a receipt under RBI Circular DCM(FNVD). "
            "(4) You can also report to the local police station. "
            "(5) Use RAKSHA AI's NETRA module to scan the note before visiting the bank."
        ),
    },
    # ── Phishing / Vishing ────────────────────────────────────────────────
    {
        "id": "phish_001",
        "title": "Phishing and Smishing Scams",
        "category": "phishing",
        "content": (
            "Phishing: Fraudulent emails or websites that mimic banks, IRCTC, EPFO, or "
            "government portals to steal login credentials. Smishing: Same attacks via "
            "SMS. Warning signs: (1) URL is slightly misspelled (e.g. sbi-onIine.com "
            "instead of onlinesbi.com). (2) Urgent language: 'Your account will be "
            "blocked in 24 hours'. (3) Asks you to click a link and enter OTP or "
            "password. Safe practices: Always type bank URLs directly in the browser. "
            "Look for HTTPS and the padlock icon. Never click links in unsolicited SMS "
            "or emails. Use TRAI's DND service to block promotional calls."
        ),
    },
    {
        "id": "phish_002",
        "title": "Vishing — Voice Phishing",
        "category": "phishing",
        "content": (
            "Vishing (voice phishing) is when fraudsters call you pretending to be from "
            "your bank, EPFO, insurance company, or a tech company. Common scenarios: "
            "(1) 'Your credit card is blocked — please verify your card number and CVV.' "
            "(2) 'Your KYC needs updating — share the OTP we just sent you.' "
            "(3) 'We've detected suspicious activity — approve this transaction to block "
            "it.' Remember: No bank ever asks for your CVV, full card number, OTP, or "
            "password over the phone. If you get such a call, hang up and call your "
            "bank's official number from the back of your card."
        ),
    },
    # ── Cyber Helplines & Reporting ───────────────────────────────────────
    {
        "id": "help_001",
        "title": "National Cyber Crime Helpline — 1930",
        "category": "helpline",
        "content": (
            "The National Cyber Crime Helpline number is 1930. It is operational 24x7 "
            "across India. Call 1930 immediately if: you have been defrauded online, "
            "you received a digital arrest call, your bank account was debited without "
            "your authorization, you received fake currency, or you suspect your "
            "accounts have been compromised. The earlier you report, the higher the "
            "chance of fund recovery. The helpline can coordinate with banks and payment "
            "gateways to freeze fraudulent transactions."
        ),
    },
    {
        "id": "help_002",
        "title": "How to File a Cybercrime Complaint Online",
        "category": "helpline",
        "content": (
            "To file a cybercrime complaint online: (1) Visit cybercrime.gov.in. "
            "(2) Click on 'Report Cyber Crime'. (3) Select the type: Financial Fraud, "
            "Women/Child Related Crime, or Other Crimes. (4) For financial fraud, "
            "select 'Report Financial Fraud' and fill in transaction details, bank name, "
            "account number, and amount. (5) Upload any screenshots or evidence. "
            "(6) Submit and note your complaint ID for tracking. "
            "You can also visit your local police station and file an FIR under the "
            "Information Technology Act 2000 and relevant IPC sections."
        ),
    },
    {
        "id": "help_003",
        "title": "Other Important Helpline Numbers",
        "category": "helpline",
        "content": (
            "Important helpline numbers for cyber fraud in India: "
            "1930 — National Cyber Crime Helpline (24x7). "
            "112 — Police Emergency. "
            "1800-11-0001 — CERT-In (Indian Computer Emergency Response Team). "
            "14440 — RBI helpline for banking grievances. "
            "155261 — Investor helpline (SEBI registered). "
            "1800-180-1961 — TRAI helpline for spam/unsolicited calls. "
            "You can also follow @Cyberdost on Twitter/X for real-time scam alerts "
            "from the Ministry of Home Affairs."
        ),
    },
    # ── Social Media Fraud ────────────────────────────────────────────────
    {
        "id": "social_001",
        "title": "Social Media Impersonation and Romance Scams",
        "category": "social_media_fraud",
        "content": (
            "Social media scams: (1) Impersonation — fraudsters clone profiles of your "
            "friends and family and send friend requests, then ask for money in an "
            "emergency. Always verify by calling the person directly. "
            "(2) Romance scams — fraudsters build emotional relationships over months "
            "on dating apps or social media, then claim to need money for medical "
            "emergencies, travel, or customs clearance. (3) Fake customer service — "
            "fraudsters create fake Twitter/X or Facebook pages for banks and utilities, "
            "respond to complaints, and ask for account details. Always use only the "
            "official website or app to contact your bank."
        ),
    },
    # ── Child Safety Online ───────────────────────────────────────────────
    {
        "id": "child_001",
        "title": "Online Safety for Children",
        "category": "child_safety",
        "content": (
            "Protecting children online: (1) Teach children never to share personal "
            "information (name, school, address, phone) with strangers online. "
            "(2) Enable parental controls on devices and routers. (3) Monitor online "
            "gaming — fraudsters pose as fellow players and build friendships to extract "
            "money or personal details. (4) Cyberbullying — report to the school and "
            "file a complaint at cybercrime.gov.in. (5) POCSO-related online offenses "
            "can be reported anonymously at cybercrime.gov.in/Webform/cybercrime_women.aspx. "
            "National helpline for children: 1098 (Childline)."
        ),
    },
    # ── Identity Theft ────────────────────────────────────────────────────
    {
        "id": "id_001",
        "title": "Aadhaar and Identity Theft",
        "category": "identity_theft",
        "content": (
            "Aadhaar-related fraud: (1) Fraudsters use your Aadhaar to apply for loans, "
            "SIM cards, or open bank accounts. (2) Always lock your Aadhaar biometrics "
            "on the UIDAI app or portal (myAadhaar.uidai.gov.in) when not in active use. "
            "(3) Use virtual ID (VID) instead of your real Aadhaar number for "
            "verification. (4) Regularly check your Aadhaar authentication history on "
            "the UIDAI portal. (5) Report misuse to 1947 (UIDAI helpline) or "
            "1930 (Cyber Crime). (6) Never share a photocopy of your Aadhaar with "
            "unnecessary parties — use a masked Aadhaar copy instead."
        ),
    },
    # ── E-Commerce Fraud ──────────────────────────────────────────────────
    {
        "id": "ecom_001",
        "title": "Online Shopping and E-Commerce Fraud",
        "category": "ecommerce_fraud",
        "content": (
            "E-commerce fraud types: (1) Fake product listings on social media — order "
            "never arrives, no refund. (2) Fake COD (Cash on Delivery) scam — you "
            "receive an empty box or wrong item and the seller becomes unreachable. "
            "(3) Fake refund scams — fraudster calls saying 'your order was cancelled, "
            "we will refund — share your UPI number', then sends a collect request "
            "instead of a payment request. (4) Fake e-commerce websites that look "
            "identical to Flipkart, Amazon, or Meesho but are phishing sites. "
            "Safety tips: Shop only on established platforms. Check seller ratings. "
            "Pay via credit card for buyer protection. Never share OTP for COD delivery."
        ),
    },
    # ── Government Scheme Fraud ───────────────────────────────────────────
    {
        "id": "govt_001",
        "title": "Fake Government Scheme Fraud",
        "category": "govt_fraud",
        "content": (
            "Fraudsters create fake websites and WhatsApp messages claiming to offer "
            "government benefits: fake PM Kisan instalments, fake Aayushman Bharat "
            "cards, fake EPFO withdrawals, fake electricity subsidy, and fake jobs in "
            "government schemes. They ask for a small 'registration fee' or your bank "
            "account details. Legitimate government schemes: (1) Never charge a "
            "registration fee. (2) Are available only on official .gov.in websites. "
            "(3) Never ask for your bank PIN or OTP. To verify any government scheme, "
            "visit the official government portal or call 1930."
        ),
    },
    # ── WhatsApp Fraud ────────────────────────────────────────────────────
    {
        "id": "wa_001",
        "title": "WhatsApp Scams and Account Takeover",
        "category": "whatsapp_fraud",
        "content": (
            "WhatsApp scams: (1) Account takeover — fraudster texts 'I accidentally "
            "sent an OTP to your number, please forward it to me.' This OTP is the "
            "WhatsApp login code for YOUR account. Never share it. (2) Lottery/gift "
            "scams — messages claiming you won Rs.50 lakh in a WhatsApp lottery. "
            "(3) Fake job offers — well-crafted messages with fake company logos. "
            "(4) Call forwarding scam — fraudster tricks you into dialling a number "
            "that activates call forwarding, redirecting your OTPs to them. "
            "Enable WhatsApp Two-Step Verification (Settings > Account > Two-step "
            "verification) immediately."
        ),
    },
    # ── General Cyber Hygiene ─────────────────────────────────────────────
    {
        "id": "hygiene_001",
        "title": "Basic Cyber Hygiene Tips",
        "category": "cyber_hygiene",
        "content": (
            "Essential cyber hygiene practices for every Indian citizen: "
            "(1) Use strong, unique passwords for every account — use a password manager. "
            "(2) Enable Two-Factor Authentication (2FA) on all banking, email, and social "
            "media accounts. (3) Keep your phone and apps updated — patches fix security "
            "vulnerabilities. (4) Do not use public Wi-Fi for banking or UPI transactions. "
            "(5) Regularly check your CIBIL report for loans or credit cards taken in "
            "your name. (6) Do not click on unknown links, even if sent by known contacts "
            "(their account may be compromised). (7) Review app permissions — apps should "
            "not have access to contacts, SMS, or microphone unless essential. "
            "(8) Back up important data regularly."
        ),
    },
    # ── RAKSHA AI Platform Info ───────────────────────────────────────────
    {
        "id": "platform_001",
        "title": "RAKSHA AI Platform — How It Helps You",
        "category": "platform",
        "content": (
            "RAKSHA AI is an AI-powered Digital Public Safety Intelligence Platform "
            "with five modules: (1) SENTINEL — Detects digital arrest scams and "
            "analyzes call transcripts for scam patterns. (2) NETRA — Scans currency "
            "notes to identify fake/counterfeit notes using computer vision. "
            "(3) JAAL — Maps fraud networks and identifies organized crime rings. "
            "(4) DRISHTI — Shows real-time cybercrime hotspots on a map for your area. "
            "(5) KAVACH — This AI chatbot that provides instant fraud safety guidance, "
            "answers your questions, and connects you to the right helpline. "
            "All services are free and built to protect Indian citizens."
        ),
    },
]


def get_builtin_documents() -> list[Document]:
    return [
        Document(
            id=d["id"],
            title=d["title"],
            content=d["content"],
            source="RAKSHA_AI_CORPUS",
            category=d["category"],
            metadata={"category": d["category"]},
        )
        for d in BUILTIN_CORPUS
    ]


# ---------------------------------------------------------------------------
# Local document loader (development only)
# ---------------------------------------------------------------------------

LOCAL_DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "kavach_docs")


def load_local_documents() -> list[Document]:
    """Load .txt and .md files from the local kavach_docs directory.

    Returns an empty list if the directory doesn't exist or is empty,
    so this is always safe to call.
    """
    docs: list[Document] = []
    docs_dir = os.path.abspath(LOCAL_DOCS_DIR)

    if not os.path.isdir(docs_dir):
        logger.debug("Local docs directory not found: %s", docs_dir)
        return docs

    for fname in os.listdir(docs_dir):
        if not fname.lower().endswith((".txt", ".md")):
            continue
        if fname.lower() == "readme.md":
            continue  # skip the instructions file

        fpath = os.path.join(docs_dir, fname)
        try:
            with open(fpath, encoding="utf-8") as f:
                content = f.read().strip()
            if not content:
                continue

            # Use first non-empty line as title if it looks like a heading
            lines = [l.strip() for l in content.splitlines() if l.strip()]
            first_line = lines[0].lstrip("# ").strip() if lines else fname
            title = first_line if len(first_line) < 120 else fname.replace("_", " ").replace(".txt", "").replace(".md", "").title()

            doc_id = f"local_{fname.replace(' ', '_').replace('.', '_')}"
            docs.append(Document(
                id=doc_id,
                title=title,
                content=content,
                source="LOCAL_DOCS",
                category="local",
                url="",
                metadata={"filename": fname, "category": "local"},
            ))
            logger.debug("Loaded local doc: %s (%d chars)", fname, len(content))
        except Exception as exc:
            logger.warning("Failed to load local doc %s: %s", fname, exc)

    logger.info("Loaded %d local documents from %s", len(docs), docs_dir)
    return docs


def scrape_all(include_web: bool = True) -> list[Document]:
    """Return all documents — built-in corpus + local docs (dev) + optional web scraping.

    Local documents from app/data/kavach_docs/ are included only when
    FASTAPI_DEBUG=true (local development). In production they are skipped
    so there is nothing to configure or accidentally expose.
    """
    docs = get_builtin_documents()
    logger.info("Loaded %d built-in documents", len(docs))

    # Load local docs in development only
    try:
        from app.config import settings
        is_debug = settings.fastapi_debug
    except Exception:
        is_debug = True  # safe default — include local docs if config unavailable

    if is_debug:
        local_docs = load_local_documents()
        if local_docs:
            docs.extend(local_docs)
            logger.info("Added %d local documents (dev mode)", len(local_docs))
    else:
        logger.info("Production mode — skipping local docs directory")

    if include_web:
        for scraper, name in [
            (scrape_cybercrime_gov, "cybercrime.gov.in"),
            (scrape_rbi_advisories, "rbi.org.in"),
        ]:
            try:
                scraped = scraper()
                docs.extend(scraped)
                logger.info("Scraped %d docs from %s", len(scraped), name)
            except Exception as exc:
                logger.warning("Scraper %s failed: %s", name, exc)

    logger.info("Total documents collected: %d", len(docs))
    return docs
