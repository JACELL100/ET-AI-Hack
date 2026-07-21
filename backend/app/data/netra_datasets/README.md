# NETRA authorised training-data contract

Place only licensed, consented or agency-authorised images under the directory
configured by `NETRA_DATASET_DIR` (default: `backend/data/netra/datasets`). A
dataset is registered as:

```text
backend/data/netra/datasets/<dataset-name>/
  manifest.jsonl
  images/
    <image files>
```

Each `manifest.jsonl` row must use a relative image path and a verified label:

```json
{"path":"images/500-auth-001.jpg","label":"authentic","denomination":"500","source_case":"approved-reference-set-v1"}
{"path":"images/500-ficn-001.jpg","label":"counterfeit","denomination":"500","source_case":"approved-ficn-set-v1"}
```

Do not train from web images, generated notes, screenshots, or unverified
crowd uploads. For a release candidate, use a versioned hold-out set with both
classes for every intended denomination/device/lighting subgroup. Run:

```text
POST /api/v1/netra/model/train
{"datasetName":"approved-ficn-v1","modelName":"ficn-baseline-v1"}

POST /api/v1/netra/model/evaluate
{"datasetName":"approved-ficn-holdout-v1"}
```

NETRA will not mark a model ready unless the configured hold-out accuracy and
false-positive-rate gates are passed. This baseline is deliberately
transparent and must be replaced or benchmarked against a vetted CNN/feature
localisation model before deployment in banking or law-enforcement workflows.

## Colab CNN export

`notebooks/NETRA_FICN_Training_Colab.ipynb` trains a `NETRA-KERAS-1` CNN and
exports `active_model.keras` plus `active_model_card.json`. Place both files in
`NETRA_MODEL_DIR` (default `backend/data/netra/models`) and install
`tensorflow-cpu`; NETRA verifies the artefact SHA-256 and the release gates
before inference. The notebook defaults to a research Kaggle candidate only;
it is not RBI-certified and must be replaced by an RBI/agency-authorised FICN
dataset for operational use.
