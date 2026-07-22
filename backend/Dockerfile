# ═══════════════════════════════════════════════════════════════════
# Stage 1 — Convert Keras model → TFLite
# ═══════════════════════════════════════════════════════════════════
FROM python:3.11-slim-bookworm AS model-converter

RUN pip install --no-cache-dir "tensorflow-cpu>=2.16,<2.19"

COPY scripts/convert_to_tflite.py /tmp/convert.py
COPY data/netra/models/ /tmp/models/

# Convert .keras → .tflite; if it fails, keep the original files unchanged.
# Stage 3 copies the entire /tmp/models/ directory so either format works.
RUN python /tmp/convert.py /tmp/models \
    || echo "WARN: TFLite conversion skipped — runtime will use Keras/Linear fallback if TF is available"

# ═══════════════════════════════════════════════════════════════════
# Stage 2 — Install WhatsApp bridge Node.js dependencies
# ═══════════════════════════════════════════════════════════════════
FROM node:20-slim AS node-builder

WORKDIR /bridge
COPY whatsapp-bridge/package.json whatsapp-bridge/package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund 2>/dev/null \
    || npm install --omit=dev --no-audit --no-fund

# ═══════════════════════════════════════════════════════════════════
# Stage 3 — Runtime image
# ═══════════════════════════════════════════════════════════════════
FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    # Default port for Render (overridden by $PORT env var)
    PORT=10000 \
    # Whisper model: use 'tiny' for free tier (39 MB vs 142 MB)
    SENTINEL_WHISPER_MODEL=tiny \
    # WhatsApp bridge runs inside the same container
    WHATSAPP_BRIDGE_URL=http://localhost:3001

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       libsndfile1 \
       tesseract-ocr \
       curl \
       gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get purge -y curl gnupg \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ──────────────────────────────────────────
COPY requirements.txt ./

# Install PyTorch CPU-only first (saves ~1.5 GB vs CUDA version),
# then install the rest of the requirements.
RUN pip install --upgrade pip \
    && pip install torch torchvision torchaudio \
       --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r requirements.txt

# ── Application code ─────────────────────────────────────────────
COPY . .

# ── NETRA models (from Stage 1 — may include .tflite if conversion succeeded) ──
COPY --from=model-converter /tmp/models/ data/netra/models/

# ── WhatsApp bridge node_modules (from Stage 2) ──────────────────
COPY --from=node-builder /bridge/node_modules whatsapp-bridge/node_modules

# ── Pre-download YOLO model (5.6 MB) so cold starts are faster ──
RUN python -c "from ultralytics import YOLO; YOLO('yolo12n.pt')" 2>/dev/null || true

# ── Create runtime directories ──────────────────────────────────
RUN mkdir -p data_runtime whatsapp-bridge/.baileys_auth .hf_cache

EXPOSE 10000

# ── Start both services via supervisord ──────────────────────────
CMD ["supervisord", "-c", "supervisord.conf"]