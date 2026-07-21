"""JAAL — fraud network graph intelligence (rich mock data).

Three distinct fraud ring clusters with full node/edge graphs:
  c-mumbai  — Mumbai Digital Arrest Ring
  c-jamtara — Jamtara KYC Fraud Network
  c-delhi   — Delhi Investment Scam Cluster
"""
from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
from hashlib import sha256
import json
import re
from uuid import uuid4

from app.services.evidence_ledger import append_evidence
from app.services.evidence_package_store import get_package, persist_package, verify_package

# ---------------------------------------------------------------------------
# Community manifest (returned by get_communities)
# ---------------------------------------------------------------------------

_COMMUNITIES: list[dict] = [
    {
        "id": "c-mumbai",
        "name": "Mumbai Digital Arrest Ring",
        "nodeCount": 47,
        "riskScore": 0.94,
        "primaryType": "hub",
        "lastActive": "2026-07-19T22:00:00Z",
        "description": (
            "CBI/ED impersonation operation running from Navi Mumbai. "
            "3 hub operators, 12 mules, \u20b94.2Cr defrauded."
        ),
    },
    {
        "id": "c-jamtara",
        "name": "Jamtara KYC Fraud Network",
        "nodeCount": 31,
        "riskScore": 0.87,
        "primaryType": "phone",
        "lastActive": "2026-07-18T15:30:00Z",
        "description": (
            "OTP harvesting ring using fake bank portals. "
            "8 phone numbers, 6 mule accounts across Jharkhand."
        ),
    },
    {
        "id": "c-delhi",
        "name": "Delhi Investment Scam Cluster",
        "nodeCount": 22,
        "riskScore": 0.76,
        "primaryType": "person",
        "lastActive": "2026-07-17T10:00:00Z",
        "description": (
            "Fake crypto investment scheme. "
            "Targets HNI individuals via WhatsApp. \u20b91.8Cr defrauded."
        ),
    },
]

# ---------------------------------------------------------------------------
# c-mumbai — Mumbai Digital Arrest Ring
# ---------------------------------------------------------------------------

_MUMBAI_NODES: list[dict] = [
    {
        "id": "mum-hub-1",
        "label": "Rajan Desai (Hub Commander)",
        "type": "hub",
        "riskScore": 0.97,
        "metadata": {
            "alias": "The Director",
            "commands_count": 312,
            "subordinates": ["mum-hub-2", "mum-hub-3", "mum-mule-1", "mum-mule-2"],
            "location": "Navi Mumbai, Sector 17",
        },
        "evidenceRefs": ["FIR-2026-MH-0892", "CDR-LOG-0112", "SURV-NM-0034"],
    },
    {
        "id": "mum-hub-2",
        "label": "Prakash Tawde (Hub Operator)",
        "type": "hub",
        "riskScore": 0.93,
        "metadata": {
            "alias": "Prakash CBI",
            "commands_count": 178,
            "subordinates": ["mum-mule-3", "mum-mule-4", "mum-mule-5"],
            "location": "Thane, Maharashtra",
        },
        "evidenceRefs": ["FIR-2026-MH-0893", "CDR-LOG-0113", "ARREST-MH-0071"],
    },
    {
        "id": "mum-hub-3",
        "label": "Salim Shaikh (Tech Hub)",
        "type": "hub",
        "riskScore": 0.91,
        "metadata": {
            "alias": "Salim Tech",
            "commands_count": 201,
            "subordinates": ["mum-mule-6", "mum-mule-7"],
            "location": "Kurla, Mumbai",
        },
        "evidenceRefs": ["FIR-2026-MH-0901", "CDR-LOG-0198", "TXN-TRAIL-440"],
    },
    {
        "id": "mum-mule-1",
        "label": "Deepak Pawar (Mule)",
        "type": "mule",
        "riskScore": 0.85,
        "metadata": {
            "alias": "D Pawar",
            "recruited_by": "mum-hub-1",
            "mule_accounts": ["mum-acc-1", "mum-acc-2"],
            "active_since": "2025-11-03",
        },
        "evidenceRefs": ["FIR-2026-MH-0910", "TXN-TRAIL-221"],
    },
    {
        "id": "mum-mule-2",
        "label": "Neha Joshi (Mule)",
        "type": "mule",
        "riskScore": 0.78,
        "metadata": {
            "alias": "N Joshi",
            "recruited_by": "mum-hub-1",
            "mule_accounts": ["mum-acc-3"],
            "active_since": "2025-12-15",
        },
        "evidenceRefs": ["FIR-2026-MH-0911", "TXN-TRAIL-222"],
    },
    {
        "id": "mum-mule-3",
        "label": "Amit Rane (Mule)",
        "type": "mule",
        "riskScore": 0.82,
        "metadata": {
            "alias": "A Rane",
            "recruited_by": "mum-hub-2",
            "mule_accounts": ["mum-acc-4"],
            "active_since": "2026-01-10",
        },
        "evidenceRefs": ["FIR-2026-MH-0912", "TXN-TRAIL-223"],
    },
    {
        "id": "mum-mule-4",
        "label": "Sunita Kamble (Mule)",
        "type": "mule",
        "riskScore": 0.76,
        "metadata": {
            "alias": "S Kamble",
            "recruited_by": "mum-hub-2",
            "mule_accounts": ["mum-acc-5"],
            "active_since": "2026-02-20",
        },
        "evidenceRefs": ["TXN-TRAIL-224", "BANK-FREEZE-0022"],
    },
    {
        "id": "mum-mule-5",
        "label": "Rahul More (Mule)",
        "type": "mule",
        "riskScore": 0.80,
        "metadata": {
            "alias": "R More",
            "recruited_by": "mum-hub-2",
            "mule_accounts": ["mum-acc-6"],
            "active_since": "2026-01-28",
        },
        "evidenceRefs": ["FIR-2026-MH-0913", "TXN-TRAIL-225"],
    },
    {
        "id": "mum-mule-6",
        "label": "Priya Patil (Mule)",
        "type": "mule",
        "riskScore": 0.74,
        "metadata": {
            "alias": "P Patil",
            "recruited_by": "mum-hub-3",
            "mule_accounts": ["mum-acc-7"],
            "active_since": "2026-03-05",
        },
        "evidenceRefs": ["TXN-TRAIL-226"],
    },
    {
        "id": "mum-mule-7",
        "label": "Kiran Shinde (Mule)",
        "type": "mule",
        "riskScore": 0.72,
        "metadata": {
            "alias": "K Shinde",
            "recruited_by": "mum-hub-3",
            "mule_accounts": ["mum-acc-8"],
            "active_since": "2026-03-18",
        },
        "evidenceRefs": ["TXN-TRAIL-227"],
    },
    {
        "id": "mum-person-1",
        "label": "Vikram Nair (Caller)",
        "type": "person",
        "riskScore": 0.90,
        "metadata": {
            "name": "Vikram Nair",
            "location": "Navi Mumbai",
            "aadhaar_partial": "XXXX-XXXX-4421",
            "reports_count": 34,
            "first_seen": "2025-10-01",
            "last_seen": "2026-07-19",
        },
        "evidenceRefs": ["CDR-LOG-0445", "FIR-2026-MH-0892"],
    },
    {
        "id": "mum-person-2",
        "label": "Suresh Mehta (Scribe)",
        "type": "person",
        "riskScore": 0.83,
        "metadata": {
            "name": "Suresh Mehta",
            "location": "Thane",
            "aadhaar_partial": "XXXX-XXXX-8812",
            "reports_count": 21,
            "first_seen": "2025-11-15",
            "last_seen": "2026-07-17",
        },
        "evidenceRefs": ["CDR-LOG-0446", "SURV-NM-0035"],
    },
    {
        "id": "mum-ph-1",
        "label": "+91-98201-44310",
        "type": "phone",
        "riskScore": 0.96,
        "metadata": {
            "number": "+91-98201-44310",
            "carrier": "Jio",
            "telecom_circle": "Mumbai",
            "call_count": 412,
            "flagged_calls": 389,
        },
        "evidenceRefs": ["CDR-LOG-0445", "TRAI-FLAG-0091"],
    },
    {
        "id": "mum-ph-2",
        "label": "+91-70211-88920",
        "type": "phone",
        "riskScore": 0.91,
        "metadata": {
            "number": "+91-70211-88920",
            "carrier": "Airtel",
            "telecom_circle": "Maharashtra",
            "call_count": 287,
            "flagged_calls": 251,
        },
        "evidenceRefs": ["CDR-LOG-0446", "TRAI-FLAG-0092"],
    },
    {
        "id": "mum-ph-3",
        "label": "+91-91366-20011",
        "type": "phone",
        "riskScore": 0.88,
        "metadata": {
            "number": "+91-91366-20011",
            "carrier": "BSNL",
            "telecom_circle": "Mumbai",
            "call_count": 198,
            "flagged_calls": 165,
        },
        "evidenceRefs": ["CDR-LOG-0447"],
    },
    {
        "id": "mum-acc-1",
        "label": "HDFC **7743",
        "type": "account",
        "riskScore": 0.92,
        "metadata": {
            "bank": "HDFC Bank",
            "account_partial": "**7743",
            "transactions_count": 156,
            "total_amount_lakhs": 84.3,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-221", "BANK-FREEZE-0021"],
    },
    {
        "id": "mum-acc-2",
        "label": "Kotak **3391",
        "type": "account",
        "riskScore": 0.88,
        "metadata": {
            "bank": "Kotak Mahindra",
            "account_partial": "**3391",
            "transactions_count": 98,
            "total_amount_lakhs": 61.7,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-228", "BANK-FREEZE-0023"],
    },
    {
        "id": "mum-acc-3",
        "label": "SBI **8812",
        "type": "account",
        "riskScore": 0.80,
        "metadata": {
            "bank": "State Bank of India",
            "account_partial": "**8812",
            "transactions_count": 74,
            "total_amount_lakhs": 42.1,
            "freeze_status": False,
        },
        "evidenceRefs": ["TXN-TRAIL-229"],
    },
    {
        "id": "mum-acc-4",
        "label": "Axis **5564",
        "type": "account",
        "riskScore": 0.83,
        "metadata": {
            "bank": "Axis Bank",
            "account_partial": "**5564",
            "transactions_count": 112,
            "total_amount_lakhs": 55.8,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-230", "BANK-FREEZE-0024"],
    },
]

_MUMBAI_EDGES: list[dict] = [
    {"id": "mum-e01", "source": "mum-hub-1", "target": "mum-hub-2", "type": "COMMANDS", "weight": 1.0, "timestamp": "2026-07-19T20:00:00Z"},
    {"id": "mum-e02", "source": "mum-hub-1", "target": "mum-hub-3", "type": "COMMANDS", "weight": 1.0, "timestamp": "2026-07-19T20:01:00Z"},
    {"id": "mum-e03", "source": "mum-hub-1", "target": "mum-mule-1", "type": "RECRUITED", "weight": 0.95, "timestamp": "2025-11-03T10:00:00Z"},
    {"id": "mum-e04", "source": "mum-hub-1", "target": "mum-mule-2", "type": "RECRUITED", "weight": 0.95, "timestamp": "2025-12-15T10:00:00Z"},
    {"id": "mum-e05", "source": "mum-hub-2", "target": "mum-mule-3", "type": "RECRUITED", "weight": 0.90, "timestamp": "2026-01-10T10:00:00Z"},
    {"id": "mum-e06", "source": "mum-hub-2", "target": "mum-mule-4", "type": "RECRUITED", "weight": 0.88, "timestamp": "2026-02-20T10:00:00Z"},
    {"id": "mum-e07", "source": "mum-hub-2", "target": "mum-mule-5", "type": "RECRUITED", "weight": 0.89, "timestamp": "2026-01-28T10:00:00Z"},
    {"id": "mum-e08", "source": "mum-hub-3", "target": "mum-mule-6", "type": "RECRUITED", "weight": 0.85, "timestamp": "2026-03-05T10:00:00Z"},
    {"id": "mum-e09", "source": "mum-hub-3", "target": "mum-mule-7", "type": "RECRUITED", "weight": 0.83, "timestamp": "2026-03-18T10:00:00Z"},
    {"id": "mum-e10", "source": "mum-person-1", "target": "mum-ph-1", "type": "OWNS", "weight": 1.0, "timestamp": "2025-10-01T08:00:00Z"},
    {"id": "mum-e11", "source": "mum-person-2", "target": "mum-ph-2", "type": "OWNS", "weight": 1.0, "timestamp": "2025-11-15T08:00:00Z"},
    {"id": "mum-e12", "source": "mum-hub-3", "target": "mum-ph-3", "type": "OWNS", "weight": 1.0, "timestamp": "2026-01-01T08:00:00Z"},
    {"id": "mum-e13", "source": "mum-ph-1", "target": "mum-ph-2", "type": "CALLED", "weight": 0.87, "timestamp": "2026-07-19T21:00:00Z"},
    {"id": "mum-e14", "source": "mum-ph-2", "target": "mum-ph-3", "type": "CALLED", "weight": 0.75, "timestamp": "2026-07-19T21:05:00Z"},
    {"id": "mum-e15", "source": "mum-mule-1", "target": "mum-acc-1", "type": "OWNS", "weight": 1.0, "timestamp": "2025-11-03T12:00:00Z"},
    {"id": "mum-e16", "source": "mum-mule-1", "target": "mum-acc-2", "type": "OWNS", "weight": 1.0, "timestamp": "2025-11-10T12:00:00Z"},
    {"id": "mum-e17", "source": "mum-mule-2", "target": "mum-acc-3", "type": "OWNS", "weight": 1.0, "timestamp": "2025-12-15T12:00:00Z"},
    {"id": "mum-e18", "source": "mum-mule-3", "target": "mum-acc-4", "type": "OWNS", "weight": 1.0, "timestamp": "2026-01-10T12:00:00Z"},
    {"id": "mum-e19", "source": "mum-acc-1", "target": "mum-acc-2", "type": "TRANSFERRED_TO", "weight": 0.92, "timestamp": "2026-07-15T14:00:00Z"},
    {"id": "mum-e20", "source": "mum-acc-2", "target": "mum-acc-4", "type": "TRANSFERRED_TO", "weight": 0.88, "timestamp": "2026-07-16T14:00:00Z"},
    {"id": "mum-e21", "source": "mum-acc-3", "target": "mum-acc-1", "type": "TRANSFERRED_TO", "weight": 0.80, "timestamp": "2026-07-17T09:00:00Z"},
    {"id": "mum-e22", "source": "mum-person-1", "target": "mum-hub-1", "type": "ASSOCIATED_WITH", "weight": 0.93, "timestamp": "2025-10-05T10:00:00Z"},
    {"id": "mum-e23", "source": "mum-person-2", "target": "mum-hub-2", "type": "ASSOCIATED_WITH", "weight": 0.86, "timestamp": "2025-11-20T10:00:00Z"},
]


# ---------------------------------------------------------------------------
# c-jamtara — Jamtara KYC Fraud Network
# ---------------------------------------------------------------------------

_JAMTARA_NODES: list[dict] = [
    {
        "id": "jam-person-1",
        "label": "Pintu Mandal (Ringleader)",
        "type": "person",
        "riskScore": 0.95,
        "metadata": {
            "name": "Pintu Mandal",
            "location": "Jamtara, Jharkhand",
            "aadhaar_partial": "XXXX-XXXX-3301",
            "reports_count": 58,
            "first_seen": "2025-08-12",
            "last_seen": "2026-07-18",
        },
        "evidenceRefs": ["FIR-2026-JH-0441", "CDR-LOG-0881", "SURV-JH-0011"],
    },
    {
        "id": "jam-person-2",
        "label": "Raju Soren (Tech Operator)",
        "type": "person",
        "riskScore": 0.88,
        "metadata": {
            "name": "Raju Soren",
            "location": "Dumka, Jharkhand",
            "aadhaar_partial": "XXXX-XXXX-7712",
            "reports_count": 41,
            "first_seen": "2025-09-01",
            "last_seen": "2026-07-17",
        },
        "evidenceRefs": ["FIR-2026-JH-0442", "CDR-LOG-0882"],
    },
    {
        "id": "jam-person-3",
        "label": "Sunita Tudu (Phishing Admin)",
        "type": "person",
        "riskScore": 0.84,
        "metadata": {
            "name": "Sunita Tudu",
            "location": "Jamtara, Jharkhand",
            "aadhaar_partial": "XXXX-XXXX-5529",
            "reports_count": 29,
            "first_seen": "2025-10-05",
            "last_seen": "2026-07-16",
        },
        "evidenceRefs": ["FIR-2026-JH-0443", "PHISH-SITE-0031"],
    },
    {
        "id": "jam-mule-1",
        "label": "Bablu Das (Mule)",
        "type": "mule",
        "riskScore": 0.80,
        "metadata": {
            "alias": "B Das",
            "recruited_by": "jam-person-1",
            "mule_accounts": ["jam-acc-1", "jam-acc-2"],
            "active_since": "2025-09-15",
        },
        "evidenceRefs": ["TXN-TRAIL-310", "FIR-2026-JH-0450"],
    },
    {
        "id": "jam-mule-2",
        "label": "Chotu Kisku (Mule)",
        "type": "mule",
        "riskScore": 0.76,
        "metadata": {
            "alias": "C Kisku",
            "recruited_by": "jam-person-1",
            "mule_accounts": ["jam-acc-3"],
            "active_since": "2025-10-20",
        },
        "evidenceRefs": ["TXN-TRAIL-311"],
    },
    {
        "id": "jam-mule-3",
        "label": "Mamta Hansdah (Mule)",
        "type": "mule",
        "riskScore": 0.73,
        "metadata": {
            "alias": "M Hansdah",
            "recruited_by": "jam-person-2",
            "mule_accounts": ["jam-acc-4"],
            "active_since": "2025-11-01",
        },
        "evidenceRefs": ["TXN-TRAIL-312"],
    },
    {
        "id": "jam-ph-1",
        "label": "+91-94311-20091",
        "type": "phone",
        "riskScore": 0.94,
        "metadata": {
            "number": "+91-94311-20091",
            "carrier": "Vi (Vodafone Idea)",
            "telecom_circle": "Jharkhand",
            "call_count": 621,
            "flagged_calls": 598,
        },
        "evidenceRefs": ["CDR-LOG-0881", "TRAI-FLAG-0120"],
    },
    {
        "id": "jam-ph-2",
        "label": "+91-82334-55610",
        "type": "phone",
        "riskScore": 0.91,
        "metadata": {
            "number": "+91-82334-55610",
            "carrier": "Jio",
            "telecom_circle": "Jharkhand",
            "call_count": 509,
            "flagged_calls": 481,
        },
        "evidenceRefs": ["CDR-LOG-0882", "TRAI-FLAG-0121"],
    },
    {
        "id": "jam-ph-3",
        "label": "+91-70044-87120",
        "type": "phone",
        "riskScore": 0.89,
        "metadata": {
            "number": "+91-70044-87120",
            "carrier": "Airtel",
            "telecom_circle": "Bihar",
            "call_count": 344,
            "flagged_calls": 302,
        },
        "evidenceRefs": ["CDR-LOG-0883"],
    },
    {
        "id": "jam-ph-4",
        "label": "+91-91055-33441",
        "type": "phone",
        "riskScore": 0.86,
        "metadata": {
            "number": "+91-91055-33441",
            "carrier": "BSNL",
            "telecom_circle": "Jharkhand",
            "call_count": 278,
            "flagged_calls": 241,
        },
        "evidenceRefs": ["CDR-LOG-0884", "TRAI-FLAG-0122"],
    },
    {
        "id": "jam-acc-1",
        "label": "BOI **4421",
        "type": "account",
        "riskScore": 0.90,
        "metadata": {
            "bank": "Bank of India",
            "account_partial": "**4421",
            "transactions_count": 203,
            "total_amount_lakhs": 47.6,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-310", "BANK-FREEZE-0031"],
    },
    {
        "id": "jam-acc-2",
        "label": "PNB **9933",
        "type": "account",
        "riskScore": 0.85,
        "metadata": {
            "bank": "Punjab National Bank",
            "account_partial": "**9933",
            "transactions_count": 167,
            "total_amount_lakhs": 38.2,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-311", "BANK-FREEZE-0032"],
    },
    {
        "id": "jam-acc-3",
        "label": "UCO **6671",
        "type": "account",
        "riskScore": 0.78,
        "metadata": {
            "bank": "UCO Bank",
            "account_partial": "**6671",
            "transactions_count": 89,
            "total_amount_lakhs": 21.4,
            "freeze_status": False,
        },
        "evidenceRefs": ["TXN-TRAIL-312"],
    },
    {
        "id": "jam-acc-4",
        "label": "Canara **2284",
        "type": "account",
        "riskScore": 0.81,
        "metadata": {
            "bank": "Canara Bank",
            "account_partial": "**2284",
            "transactions_count": 114,
            "total_amount_lakhs": 29.8,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-313", "BANK-FREEZE-0033"],
    },
    {
        "id": "jam-acc-5",
        "label": "SBI **1107",
        "type": "account",
        "riskScore": 0.75,
        "metadata": {
            "bank": "State Bank of India",
            "account_partial": "**1107",
            "transactions_count": 77,
            "total_amount_lakhs": 18.6,
            "freeze_status": False,
        },
        "evidenceRefs": ["TXN-TRAIL-314"],
    },
]

_JAMTARA_EDGES: list[dict] = [
    {"id": "jam-e01", "source": "jam-person-1", "target": "jam-person-2", "type": "ASSOCIATED_WITH", "weight": 0.92, "timestamp": "2025-08-15T10:00:00Z"},
    {"id": "jam-e02", "source": "jam-person-1", "target": "jam-person-3", "type": "ASSOCIATED_WITH", "weight": 0.88, "timestamp": "2025-10-05T10:00:00Z"},
    {"id": "jam-e03", "source": "jam-person-1", "target": "jam-mule-1", "type": "RECRUITED", "weight": 0.94, "timestamp": "2025-09-15T09:00:00Z"},
    {"id": "jam-e04", "source": "jam-person-1", "target": "jam-mule-2", "type": "RECRUITED", "weight": 0.90, "timestamp": "2025-10-20T09:00:00Z"},
    {"id": "jam-e05", "source": "jam-person-2", "target": "jam-mule-3", "type": "RECRUITED", "weight": 0.85, "timestamp": "2025-11-01T09:00:00Z"},
    {"id": "jam-e06", "source": "jam-person-1", "target": "jam-ph-1", "type": "OWNS", "weight": 1.0, "timestamp": "2025-08-12T08:00:00Z"},
    {"id": "jam-e07", "source": "jam-person-2", "target": "jam-ph-2", "type": "OWNS", "weight": 1.0, "timestamp": "2025-09-01T08:00:00Z"},
    {"id": "jam-e08", "source": "jam-person-3", "target": "jam-ph-3", "type": "OWNS", "weight": 1.0, "timestamp": "2025-10-05T08:00:00Z"},
    {"id": "jam-e09", "source": "jam-person-3", "target": "jam-ph-4", "type": "OWNS", "weight": 1.0, "timestamp": "2025-10-10T08:00:00Z"},
    {"id": "jam-e10", "source": "jam-ph-1", "target": "jam-ph-2", "type": "CALLED", "weight": 0.89, "timestamp": "2026-07-18T13:00:00Z"},
    {"id": "jam-e11", "source": "jam-ph-2", "target": "jam-ph-3", "type": "CALLED", "weight": 0.82, "timestamp": "2026-07-18T13:10:00Z"},
    {"id": "jam-e12", "source": "jam-ph-3", "target": "jam-ph-4", "type": "CALLED", "weight": 0.77, "timestamp": "2026-07-18T13:20:00Z"},
    {"id": "jam-e13", "source": "jam-mule-1", "target": "jam-acc-1", "type": "OWNS", "weight": 1.0, "timestamp": "2025-09-16T12:00:00Z"},
    {"id": "jam-e14", "source": "jam-mule-1", "target": "jam-acc-2", "type": "OWNS", "weight": 1.0, "timestamp": "2025-09-20T12:00:00Z"},
    {"id": "jam-e15", "source": "jam-mule-2", "target": "jam-acc-3", "type": "OWNS", "weight": 1.0, "timestamp": "2025-10-21T12:00:00Z"},
    {"id": "jam-e16", "source": "jam-mule-3", "target": "jam-acc-4", "type": "OWNS", "weight": 1.0, "timestamp": "2025-11-02T12:00:00Z"},
    {"id": "jam-e17", "source": "jam-person-1", "target": "jam-acc-5", "type": "OWNS", "weight": 0.95, "timestamp": "2025-08-20T12:00:00Z"},
    {"id": "jam-e18", "source": "jam-acc-1", "target": "jam-acc-5", "type": "TRANSFERRED_TO", "weight": 0.91, "timestamp": "2026-07-10T10:00:00Z"},
    {"id": "jam-e19", "source": "jam-acc-2", "target": "jam-acc-5", "type": "TRANSFERRED_TO", "weight": 0.88, "timestamp": "2026-07-11T10:00:00Z"},
    {"id": "jam-e20", "source": "jam-acc-3", "target": "jam-acc-1", "type": "TRANSFERRED_TO", "weight": 0.80, "timestamp": "2026-07-12T10:00:00Z"},
    {"id": "jam-e21", "source": "jam-acc-4", "target": "jam-acc-2", "type": "TRANSFERRED_TO", "weight": 0.83, "timestamp": "2026-07-13T10:00:00Z"},
]


# ---------------------------------------------------------------------------
# c-delhi — Delhi Investment Scam Cluster
# ---------------------------------------------------------------------------

_DELHI_NODES: list[dict] = [
    {
        "id": "del-person-1",
        "label": "Ankit Sharma (Mastermind)",
        "type": "person",
        "riskScore": 0.93,
        "metadata": {
            "name": "Ankit Sharma",
            "location": "South Delhi",
            "aadhaar_partial": "XXXX-XXXX-6601",
            "reports_count": 47,
            "first_seen": "2025-12-01",
            "last_seen": "2026-07-17",
        },
        "evidenceRefs": ["FIR-2026-DL-0231", "CDR-LOG-0601", "SURV-DL-0044"],
    },
    {
        "id": "del-person-2",
        "label": "Mohit Kapoor (Sales Lead)",
        "type": "person",
        "riskScore": 0.87,
        "metadata": {
            "name": "Mohit Kapoor",
            "location": "Noida, UP",
            "aadhaar_partial": "XXXX-XXXX-9920",
            "reports_count": 33,
            "first_seen": "2025-12-10",
            "last_seen": "2026-07-15",
        },
        "evidenceRefs": ["FIR-2026-DL-0232", "CDR-LOG-0602"],
    },
    {
        "id": "del-person-3",
        "label": "Deepika Arora (Recruiter)",
        "type": "person",
        "riskScore": 0.81,
        "metadata": {
            "name": "Deepika Arora",
            "location": "Gurgaon, Haryana",
            "aadhaar_partial": "XXXX-XXXX-4418",
            "reports_count": 22,
            "first_seen": "2026-01-05",
            "last_seen": "2026-07-14",
        },
        "evidenceRefs": ["FIR-2026-HR-0118", "SURV-DL-0045"],
    },
    {
        "id": "del-mule-1",
        "label": "Rohit Yadav (Mule)",
        "type": "mule",
        "riskScore": 0.78,
        "metadata": {
            "alias": "R Yadav",
            "recruited_by": "del-person-3",
            "mule_accounts": ["del-acc-1", "del-acc-2"],
            "active_since": "2026-01-20",
        },
        "evidenceRefs": ["TXN-TRAIL-401", "FIR-2026-DL-0240"],
    },
    {
        "id": "del-mule-2",
        "label": "Pooja Gupta (Mule)",
        "type": "mule",
        "riskScore": 0.74,
        "metadata": {
            "alias": "P Gupta",
            "recruited_by": "del-person-3",
            "mule_accounts": ["del-acc-3"],
            "active_since": "2026-02-14",
        },
        "evidenceRefs": ["TXN-TRAIL-402"],
    },
    {
        "id": "del-ph-1",
        "label": "+91-99100-77231",
        "type": "phone",
        "riskScore": 0.90,
        "metadata": {
            "number": "+91-99100-77231",
            "carrier": "Airtel",
            "telecom_circle": "Delhi",
            "call_count": 389,
            "flagged_calls": 351,
        },
        "evidenceRefs": ["CDR-LOG-0601", "TRAI-FLAG-0201"],
    },
    {
        "id": "del-ph-2",
        "label": "+91-88002-44119",
        "type": "phone",
        "riskScore": 0.85,
        "metadata": {
            "number": "+91-88002-44119",
            "carrier": "Jio",
            "telecom_circle": "UP West",
            "call_count": 274,
            "flagged_calls": 230,
        },
        "evidenceRefs": ["CDR-LOG-0602", "TRAI-FLAG-0202"],
    },
    {
        "id": "del-ph-3",
        "label": "+91-77301-56008",
        "type": "phone",
        "riskScore": 0.79,
        "metadata": {
            "number": "+91-77301-56008",
            "carrier": "Vi (Vodafone Idea)",
            "telecom_circle": "Haryana",
            "call_count": 198,
            "flagged_calls": 161,
        },
        "evidenceRefs": ["CDR-LOG-0603"],
    },
    {
        "id": "del-acc-1",
        "label": "ICICI **3318",
        "type": "account",
        "riskScore": 0.88,
        "metadata": {
            "bank": "ICICI Bank",
            "account_partial": "**3318",
            "transactions_count": 134,
            "total_amount_lakhs": 72.4,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-401", "BANK-FREEZE-0041"],
    },
    {
        "id": "del-acc-2",
        "label": "Yes Bank **7726",
        "type": "account",
        "riskScore": 0.82,
        "metadata": {
            "bank": "Yes Bank",
            "account_partial": "**7726",
            "transactions_count": 91,
            "total_amount_lakhs": 48.9,
            "freeze_status": True,
        },
        "evidenceRefs": ["TXN-TRAIL-402", "BANK-FREEZE-0042"],
    },
    {
        "id": "del-acc-3",
        "label": "HDFC **6644",
        "type": "account",
        "riskScore": 0.76,
        "metadata": {
            "bank": "HDFC Bank",
            "account_partial": "**6644",
            "transactions_count": 68,
            "total_amount_lakhs": 33.1,
            "freeze_status": False,
        },
        "evidenceRefs": ["TXN-TRAIL-403"],
    },
    {
        "id": "del-acc-4",
        "label": "Kotak **9901",
        "type": "account",
        "riskScore": 0.72,
        "metadata": {
            "bank": "Kotak Mahindra",
            "account_partial": "**9901",
            "transactions_count": 55,
            "total_amount_lakhs": 24.7,
            "freeze_status": False,
        },
        "evidenceRefs": ["TXN-TRAIL-404"],
    },
]

_DELHI_EDGES: list[dict] = [
    {"id": "del-e01", "source": "del-person-1", "target": "del-person-2", "type": "ASSOCIATED_WITH", "weight": 0.94, "timestamp": "2025-12-05T10:00:00Z"},
    {"id": "del-e02", "source": "del-person-1", "target": "del-person-3", "type": "ASSOCIATED_WITH", "weight": 0.90, "timestamp": "2026-01-05T10:00:00Z"},
    {"id": "del-e03", "source": "del-person-3", "target": "del-mule-1", "type": "RECRUITED", "weight": 0.88, "timestamp": "2026-01-20T09:00:00Z"},
    {"id": "del-e04", "source": "del-person-3", "target": "del-mule-2", "type": "RECRUITED", "weight": 0.84, "timestamp": "2026-02-14T09:00:00Z"},
    {"id": "del-e05", "source": "del-person-1", "target": "del-ph-1", "type": "OWNS", "weight": 1.0, "timestamp": "2025-12-01T08:00:00Z"},
    {"id": "del-e06", "source": "del-person-2", "target": "del-ph-2", "type": "OWNS", "weight": 1.0, "timestamp": "2025-12-10T08:00:00Z"},
    {"id": "del-e07", "source": "del-person-3", "target": "del-ph-3", "type": "OWNS", "weight": 1.0, "timestamp": "2026-01-05T08:00:00Z"},
    {"id": "del-e08", "source": "del-ph-1", "target": "del-ph-2", "type": "CALLED", "weight": 0.86, "timestamp": "2026-07-17T09:00:00Z"},
    {"id": "del-e09", "source": "del-ph-1", "target": "del-ph-3", "type": "CALLED", "weight": 0.79, "timestamp": "2026-07-17T09:15:00Z"},
    {"id": "del-e10", "source": "del-mule-1", "target": "del-acc-1", "type": "OWNS", "weight": 1.0, "timestamp": "2026-01-21T12:00:00Z"},
    {"id": "del-e11", "source": "del-mule-1", "target": "del-acc-2", "type": "OWNS", "weight": 1.0, "timestamp": "2026-01-25T12:00:00Z"},
    {"id": "del-e12", "source": "del-mule-2", "target": "del-acc-3", "type": "OWNS", "weight": 1.0, "timestamp": "2026-02-15T12:00:00Z"},
    {"id": "del-e13", "source": "del-person-1", "target": "del-acc-4", "type": "OWNS", "weight": 0.96, "timestamp": "2025-12-05T12:00:00Z"},
    {"id": "del-e14", "source": "del-acc-1", "target": "del-acc-4", "type": "TRANSFERRED_TO", "weight": 0.90, "timestamp": "2026-07-10T11:00:00Z"},
    {"id": "del-e15", "source": "del-acc-2", "target": "del-acc-4", "type": "TRANSFERRED_TO", "weight": 0.87, "timestamp": "2026-07-11T11:00:00Z"},
    {"id": "del-e16", "source": "del-acc-3", "target": "del-acc-4", "type": "TRANSFERRED_TO", "weight": 0.81, "timestamp": "2026-07-12T11:00:00Z"},
    {"id": "del-e17", "source": "del-person-2", "target": "del-acc-1", "type": "ASSOCIATED_WITH", "weight": 0.77, "timestamp": "2026-01-22T10:00:00Z"},
]

# ---------------------------------------------------------------------------
# Cluster lookup map
# ---------------------------------------------------------------------------

_CLUSTER_META: dict[str, dict] = {
    c["id"]: c for c in _COMMUNITIES
}

_CLUSTER_GRAPHS: dict[str, tuple[list[dict], list[dict]]] = {
    "c-mumbai":  (_MUMBAI_NODES,  _MUMBAI_EDGES),
    "c-jamtara": (_JAMTARA_NODES, _JAMTARA_EDGES),
    "c-delhi":   (_DELHI_NODES,   _DELHI_EDGES),
}

# Citizen-originated intelligence is intentionally kept in a separate community
# until an investigator verifies or merges it with an existing operation.  This
# makes reports useful immediately without treating an allegation as a finding.
_CITIZEN_NODES: list[dict] = []
_CITIZEN_EDGES: list[dict] = []
_CITIZEN_REPORTS: list[dict] = []
_EVIDENCE_PACKAGES: list[dict] = []
# Signed telecom, video, and payment events are separated from allegations and
# pre-seeded examples.  Investigators can promote them only after review.
_LIVE_NODES: list[dict] = []
_LIVE_EDGES: list[dict] = []
_LIVE_SIGNALS: list[dict] = []


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalise(value: str) -> str:
    """Normalise identifiers enough for correlation without exposing raw data."""
    return re.sub(r"[^a-z0-9]", "", value.lower())


def _node_matches(node: dict, query: str) -> bool:
    needle = _normalise(query)
    label = _normalise(str(node.get("label", "")))
    if needle and needle in label:
        return True
    metadata = node.get("metadata", {})
    return any(needle and needle in _normalise(str(v)) for v in metadata.values() if isinstance(v, (str, int, float)))


def _all_graphs() -> list[tuple[str, list[dict], list[dict]]]:
    return [
        (cluster_id, nodes, edges)
        for cluster_id, (nodes, edges) in _CLUSTER_GRAPHS.items()
    ] + [
        ("c-citizen-signals", _CITIZEN_NODES, _CITIZEN_EDGES),
        ("c-live-intelligence", _LIVE_NODES, _LIVE_EDGES),
    ]


def _citizen_community() -> dict:
    return {
        "id": "c-citizen-signals",
        "name": "Citizen Signal Review Queue",
        "nodeCount": len(_CITIZEN_NODES),
        "riskScore": min(0.92, 0.35 + (len(_CITIZEN_REPORTS) * 0.06)) if _CITIZEN_REPORTS else 0.0,
        "primaryType": "phone",
        "lastActive": _CITIZEN_REPORTS[0]["timestamp"] if _CITIZEN_REPORTS else _now(),
        "description": "Unverified citizen submissions awaiting JAAL correlation and investigator review.",
        "status": "review",
    }


def _live_community() -> dict:
    return {
        "id": "c-live-intelligence",
        "name": "Signed Live Intelligence Review Queue",
        "nodeCount": len(_LIVE_NODES),
        "riskScore": max((float(node.get("riskScore", 0)) for node in _LIVE_NODES), default=0.0),
        "primaryType": "phone",
        "lastActive": _LIVE_SIGNALS[0]["timestamp"] if _LIVE_SIGNALS else _now(),
        "description": "Authorised multi-source leads pending investigator corroboration; not an automated finding of guilt.",
        "status": "review",
    }


def _community_meta(community_id: str) -> dict:
    if community_id == "c-citizen-signals":
        return _citizen_community()
    if community_id == "c-live-intelligence":
        return _live_community()
    return _CLUSTER_META.get(community_id, _COMMUNITIES[0])

# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


def get_communities() -> list[dict]:
    """Return the community manifest for all known fraud rings."""
    return [*_COMMUNITIES, _citizen_community(), _live_community()]


def get_graph(cluster_id: str) -> dict:
    """Return the full node/edge graph for a specific cluster."""
    if cluster_id == "c-citizen-signals":
        meta = _citizen_community()
        nodes, edges = _CITIZEN_NODES, _CITIZEN_EDGES
    elif cluster_id == "c-live-intelligence":
        meta = _live_community()
        nodes, edges = _LIVE_NODES, _LIVE_EDGES
    else:
        nodes, edges = _CLUSTER_GRAPHS.get(
            cluster_id,
            (_MUMBAI_NODES, _MUMBAI_EDGES),  # fallback to Mumbai if unknown id
        )
        meta = _CLUSTER_META.get(cluster_id, _COMMUNITIES[0])

    high_risk = sum(1 for n in nodes if n["riskScore"] >= 0.85)

    return {
        "clusterId": cluster_id,
        "clusterName": meta["name"],
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "totalNodes": len(nodes),
            "totalEdges": len(edges),
            "highRiskNodes": high_risk,
        },
    }


def get_stats() -> dict:
    """Return aggregate statistics across all clusters."""
    all_nodes = _MUMBAI_NODES + _JAMTARA_NODES + _DELHI_NODES + _CITIZEN_NODES + _LIVE_NODES
    all_edges = _MUMBAI_EDGES + _JAMTARA_EDGES + _DELHI_EDGES + _CITIZEN_EDGES + _LIVE_EDGES

    frozen = sum(
        1
        for n in all_nodes
        if n["type"] == "account" and n["metadata"].get("freeze_status") is True
    )
    high_risk = sum(1 for n in all_nodes if n["riskScore"] >= 0.85)

    return {
        "total_nodes": len(all_nodes),
        "total_edges": len(all_edges),
        "total_communities": len(_COMMUNITIES) + 2,
        "high_risk_nodes": high_risk,
        "frozen_accounts": frozen,
        "active_investigations": len(_COMMUNITIES),
        "pending_citizen_signals": len(_CITIZEN_REPORTS),
        "pending_live_intelligence_signals": len(_LIVE_SIGNALS),
    }


def search_entities(query: str, limit: int = 10) -> list[dict]:
    """Return a minimal, citizen-safe correlation result set."""
    results: list[dict] = []
    for community_id, nodes, edges in _all_graphs():
        for node in nodes:
            if not _node_matches(node, query):
                continue
            links = sum(1 for edge in edges if edge["source"] == node["id"] or edge["target"] == node["id"])
            results.append({
                "id": node["id"],
                "label": node["label"],
                "type": node["type"],
                "riskScore": node.get("riskScore", 0),
                "communityId": community_id,
                "communityName": _community_meta(community_id)["name"],
                "connections": links,
                "status": "known" if community_id != "c-citizen-signals" else "under_review",
            })
    results.sort(key=lambda item: (item["riskScore"], item["connections"]), reverse=True)
    return results[:limit]


def _find_existing_node(value: str) -> tuple[str, dict] | None:
    for community_id, nodes, _ in _all_graphs():
        for node in nodes:
            if _node_matches(node, value):
                return community_id, node
    return None


def _citizen_node_type(entity_type: str) -> str:
    return {"phone": "phone", "account": "account", "upi": "account"}.get(entity_type.lower(), "person")


def submit_citizen_report(req: dict) -> dict:
    """Create an auditable citizen signal and correlate it against known rings."""
    report_id = f"JS-{uuid4().hex[:10].upper()}"
    timestamp = _now()
    entity_value = req["entityValue"].strip()
    related_value = (req.get("relatedEntityValue") or "").strip()
    primary_match = _find_existing_node(entity_value)
    related_match = _find_existing_node(related_value) if related_value else None

    def make_node(value: str, entity_type: str) -> dict:
        node = {
            "id": f"cit-{uuid4().hex[:10]}",
            "label": value,
            "type": _citizen_node_type(entity_type),
            "riskScore": 0.52,
            "metadata": {
                "submitted_entity_type": entity_type,
                "report_count": 1,
                "status": "unverified citizen signal",
                "first_seen": timestamp,
                "district": req.get("district") or "Not supplied",
                "state": req.get("state") or "Not supplied",
            },
            "evidenceRefs": [report_id],
        }
        _CITIZEN_NODES.append(node)
        return node

    primary = primary_match[1] if primary_match else make_node(entity_value, req.get("entityType", "phone"))
    secondary = None
    if related_value:
        secondary = related_match[1] if related_match else make_node(
            related_value, req.get("relatedEntityType") or "account"
        )

    # New report evidence is attached to a matching known node too, so an
    # investigator sees the fresh signal in the existing evidence chain.
    if primary_match:
        primary.setdefault("evidenceRefs", []).append(report_id)
        primary.setdefault("metadata", {})["citizen_report_count"] = int(primary["metadata"].get("citizen_report_count", 0)) + 1
    if secondary and related_match:
        secondary.setdefault("evidenceRefs", []).append(report_id)

    if secondary:
        _CITIZEN_EDGES.append({
            "id": f"cit-edge-{uuid4().hex[:10]}",
            "source": primary["id"],
            "target": secondary["id"],
            "type": req.get("relationship") or "REPORTED_WITH",
            "weight": 0.65,
            "timestamp": timestamp,
        })

    report = {
        "id": report_id,
        "timestamp": timestamp,
        "status": "correlated" if primary_match or related_match else "received",
        "entity": {"id": primary["id"], "label": primary["label"], "type": primary["type"]},
        "relatedEntity": {"id": secondary["id"], "label": secondary["label"], "type": secondary["type"]} if secondary else None,
        "description": req["description"],
        "reportType": req.get("reportType", "scam"),
        "district": req.get("district"),
        "state": req.get("state"),
        "matchCount": int(primary_match is not None) + int(related_match is not None),
        "reviewCommunityId": "c-citizen-signals",
    }
    _CITIZEN_REPORTS.insert(0, report)
    return {
        "report": report,
        "matches": search_entities(entity_value, 5),
        "message": "Your signal has been securely added to the JAAL review queue.",
    }


def get_citizen_reports(limit: int = 25) -> list[dict]:
    return _CITIZEN_REPORTS[:limit]


def ingest_module_signal(
    source_module: str,
    entity_value: str,
    description: str,
    *,
    entity_type: str = "phone",
    risk_score: float = 0.7,
) -> dict:
    """Shared trigger for SENTINEL, NETRA and transaction-anomaly adapters."""
    result = submit_citizen_report({
        "entityType": entity_type,
        "entityValue": entity_value,
        "description": description,
        "reportType": source_module.lower(),
        "relationship": "DETECTED_BY",
    })
    report = result["report"]
    report["sourceModule"] = source_module
    primary_id = report["entity"]["id"]
    for _, nodes, _ in _all_graphs():
        for node in nodes:
            if node["id"] == primary_id:
                node["riskScore"] = max(float(node.get("riskScore", 0)), risk_score)
                node.setdefault("metadata", {})["source_module"] = source_module
                break
    return result


def _mask_entity(value: str) -> str:
    cleaned = value.strip()
    if len(cleaned) <= 4:
        return "••••"
    return f"••••{cleaned[-4:]}"


def _live_node(value: str, entity_type: str, risk_score: float, evidence_ref: str) -> dict:
    """Find/create a privacy-minimised node for a signed partner lead."""
    existing = _find_existing_node(value)
    if existing:
        node = existing[1]
        node["riskScore"] = max(float(node.get("riskScore", 0)), risk_score)
        node.setdefault("evidenceRefs", []).append(evidence_ref)
        return node
    digest = sha256(_normalise(value).encode("utf-8")).hexdigest()[:16]
    type_map = {"caller": "phone", "callee": "phone", "beneficiary": "account"}
    node = {
        "id": f"live-{entity_type}-{digest}",
        "label": f"{type_map.get(entity_type, entity_type).title()} {_mask_entity(value)}",
        "type": type_map.get(entity_type, "person"),
        "riskScore": round(risk_score, 3),
        "metadata": {"status": "signed signal awaiting review", "fingerprint": f"sha256:{digest}"},
        "evidenceRefs": [evidence_ref],
    }
    _LIVE_NODES.append(node)
    return node


def ingest_verified_signal(signal: dict) -> dict:
    """Correlate an authorised live event without exposing raw subscriber data."""
    risk = min(1.0, max(0.0, float(signal.get("riskScore", 0))))
    evidence_ref = signal["evidenceRef"]
    primary = _live_node(signal["caller"], "caller", risk, evidence_ref)
    related: list[tuple[str, dict]] = []
    for field in ("callee", "beneficiary"):
        value = signal.get(field)
        if value:
            related.append((field, _live_node(value, field, risk * 0.9, evidence_ref)))
    timestamp = _now()
    for relation, node in related:
        edge_id = f"live-edge-{uuid4().hex[:12]}"
        _LIVE_EDGES.append({
            "id": edge_id, "source": primary["id"], "target": node["id"],
            "type": "CALLED" if relation == "callee" else "PAYMENT_RISK_LINK",
            "weight": round(risk, 3), "timestamp": timestamp, "evidenceRefs": [evidence_ref],
        })
    record = {
        "eventId": signal["eventId"], "timestamp": timestamp, "source": signal.get("source", "authorised partner"),
        "riskScore": risk, "primaryNodeId": primary["id"], "relatedNodeIds": [node["id"] for _, node in related],
        "evidenceRef": evidence_ref, "description": signal.get("description", ""), "status": "awaiting investigator review",
    }
    _LIVE_SIGNALS.insert(0, record)
    return record


def trace_relationships(req: dict) -> dict:
    """Breadth-first path discovery with relationship and transfer annotations."""
    source_id, target_id = req["sourceId"], req["targetId"]
    max_hops = req.get("maxHops", 5)
    node_map: dict[str, dict] = {}
    adjacency: dict[str, list[tuple[str, dict]]] = {}
    for _, nodes, edges in _all_graphs():
        node_map.update({node["id"]: node for node in nodes})
        for edge in edges:
            adjacency.setdefault(edge["source"], []).append((edge["target"], edge))
            adjacency.setdefault(edge["target"], []).append((edge["source"], edge))

    if source_id not in node_map or target_id not in node_map:
        return {"found": False, "message": "One or both entities are no longer available in the graph.", "path": []}

    queue = deque([(source_id, [], [source_id])])
    visited = {source_id}
    route: tuple[list[dict], list[str]] | None = None
    while queue:
        current, edge_path, node_path = queue.popleft()
        if current == target_id:
            route = (edge_path, node_path)
            break
        if len(edge_path) >= max_hops:
            continue
        for neighbour, edge in adjacency.get(current, []):
            if neighbour not in visited:
                visited.add(neighbour)
                queue.append((neighbour, [*edge_path, edge], [*node_path, neighbour]))

    if not route:
        return {"found": False, "message": f"No linked path found within {max_hops} hops.", "path": []}

    edge_path, node_path = route
    transfers = [edge for edge in edge_path if edge.get("type") == "TRANSFERRED_TO"]
    return {
        "found": True,
        "source": {"id": source_id, "label": node_map[source_id]["label"]},
        "target": {"id": target_id, "label": node_map[target_id]["label"]},
        "hops": len(edge_path),
        "path": [{"node": {"id": node_id, "label": node_map[node_id]["label"], "type": node_map[node_id]["type"]}, "via": edge_path[i] if i < len(edge_path) else None} for i, node_id in enumerate(node_path)],
        "moneyFlowEdges": transfers,
        "message": "Linked path identified. Transfer edges are highlighted for financial follow-up." if transfers else "Relationship path identified; no direct transfer edge appears in this route.",
    }


def generate_evidence_package(req: dict) -> dict:
    """Produce a deterministic JSON evidence package with an integrity hash."""
    graph = get_graph(req["communityId"])
    selected_ids = set(req.get("selectedNodeIds") or [])
    included_nodes = [node for node in graph["nodes"] if not selected_ids or node["id"] in selected_ids]
    included_ids = {node["id"] for node in included_nodes}
    included_edges = [edge for edge in graph["edges"] if edge["source"] in included_ids and edge["target"] in included_ids]
    generated_at = _now()
    payload = {
        "packageVersion": "JAAL-EVIDENCE-1.0",
        "title": req.get("title") or f"JAAL evidence package — {graph['clusterName']}",
        "community": {"id": req["communityId"], "name": graph["clusterName"]},
        "generatedAt": generated_at,
        "investigator": req.get("investigator") or "Unassigned",
        "findings": {
            "nodesIncluded": len(included_nodes),
            "relationshipsIncluded": len(included_edges),
            "highRiskEntities": [node["label"] for node in included_nodes if node.get("riskScore", 0) >= 0.85],
            "evidenceReferences": sorted({ref for node in included_nodes for ref in node.get("evidenceRefs", [])}),
        },
        "nodes": included_nodes,
        "edges": included_edges,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    ledger_record = append_evidence(
        "JAAL_EVIDENCE_PACKAGE", payload, actor=req.get("investigator") or "Unassigned", source="JAAL"
    )
    package = {
        "id": f"EP-{uuid4().hex[:12].upper()}",
        "integrity": {
            "algorithm": "SHA-256", "hash": sha256(canonical.encode("utf-8")).hexdigest(), "generatedAt": generated_at,
            "ledgerEvidenceId": ledger_record["evidence_id"], "ledgerRecordHash": ledger_record["evidence_hash"],
        },
        "chainOfCustody": [
            {"event": "PACKAGE_GENERATED", "at": generated_at, "actor": req.get("investigator") or "Unassigned"},
            {"event": "APPEND_ONLY_LEDGER_RECORDED", "at": generated_at, "actor": "JAAL", "evidenceId": ledger_record["evidence_id"]},
        ],
        "payload": payload,
    }
    persist_package(package)
    _EVIDENCE_PACKAGES.insert(0, package)
    return package


def get_evidence_package(package_id: str) -> dict | None:
    """Load an immutable evidence package from durable storage, not RAM."""
    return get_package(package_id)


def verify_evidence_package(package_id: str) -> dict:
    """Independently validate package bytes and the signed ledger chain."""
    return verify_package(package_id)
