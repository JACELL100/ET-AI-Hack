# Evaluation and safety gate

RAKSHA does not claim a detection percentage without a labelled, versioned,
hold-out evaluation set. The project now includes a reproducible SENTINEL
endpoint:

`POST /api/v1/sentinel/evaluate`

It reports the confusion matrix, accuracy, precision, recall, F1, and false
positive rate for supplied consented samples. This makes the score auditable
rather than a landing-page assertion.

## Required evaluation sets

| Module | Required hold-out data | Minimum report |
|---|---|---|
| SENTINEL | Consent-cleared calls/messages in each supported language, with scam type and event time | Precision, recall, FPR, F1, alert lead time, threshold curve |
| NETRA | RBI/agency-verified genuine and FICN images per denomination, device, lighting and print quality | Per-denomination accuracy, FPR, feature mAP, rejection/quality rate |
| JAAL | Time-sliced known network cases and benign graph data | Community recall, key-actor precision, lead time, investigator acceptance rate |
| DRISHTI | Time-stamped, de-identified incidents and withheld future periods | Hotspot F1, calibration, 24/48/72-hour prediction precision, patrol outcome |
| KAVACH | Multilingual, privacy-cleared citizen utterances and adversarial prompts | Intent accuracy by language, unsafe-advice rate, escalation false positives |

## Release criteria

1. Split by case/campaign and time, never randomise adjacent messages from the
   same scam campaign across train and test.
2. Publish sample count, language/region distribution, model/version/config,
   thresholds, confidence intervals, and all safety exclusions.
3. Review every false positive that could warn a citizen, block a number, or
   affect a payment. Human review is mandatory before disruptive action.
4. Test replayed telemetry timelines to measure *lead time before transfer*, not
   only post-event classification accuracy.
5. Do not use protected personal data or unconsented audio/video to train or
   evaluate without the required approval and governance controls.

The current repository has the evaluator and tests but no authoritative FICN,
telecom, banking, or NCRP dataset; metrics must remain **not yet measured**
until one is supplied under an authorised data agreement.
