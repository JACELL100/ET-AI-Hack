# RAKSHA AI architecture

```mermaid
flowchart LR
  T[Authorised Telecom\nCDR / CLI attestation] --> I[Signed live webhook]
  V[Authorised Video Platform\nIntegrity metadata] --> I
  P[Authorised Bank / PSP\nRisk metadata] --> I
  C[Citizen: web, WhatsApp] --> K[KAVACH]
  N[Bank/POS/Field image] --> NETRA
  I --> S[SENTINEL multi-signal fusion]
  S --> L[Hash-chained evidence ledger]
  S --> J[JAAL review graph]
  S --> D[DRISHTI live map]
  K --> J
  NETRA --> J
  J --> E[Hash-verified evidence package]
  D --> O[Command-centre operations]
  S --> A[Victim / analyst alert\nvia authorised channel]
```

Trust boundary: all third-party feeds enter through a signed, timestamped,
privacy-minimised contract. The evaluator and the command centre expose the
evidence basis for a risk assessment. Automated classification creates a lead;
an investigator validates evidence before a restrictive action.
