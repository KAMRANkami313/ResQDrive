# ResQDrive Crash Sound Service

AI-powered crash sound detection microservice.

## Setup

```bash
cd ai-service/crash_sound

python -m venv venv

# Linux/Mac
source venv/bin/activate

# OR Windows
venv\Scripts\activate

pip install -r requirements.txt
```

## Run

```bash
python -m app.main
```

Or:

```bash
uvicorn app.main:app --reload --port 8001
```

Server starts at:

```text
http://localhost:8001
```

## API

| Method | Path       | Description                         |
| ------ | ---------- | ----------------------------------- |
| GET    | `/`        | Root info                           |
| GET    | `/health`  | Health check                        |
| POST   | `/analyze` | Analyze audio file for crash sounds |

---

## POST /analyze

### Request

`multipart/form-data` with a `file` field:

- WAV file
- OR raw PCM 16-bit mono @ 16kHz

### Response

```json
{
  "is_crash": true,
  "confidence": 0.78,
  "detected_classes": [
    {
      "label": "glass_breaking",
      "confidence": 0.78
    },
    {
      "label": "metal_impact",
      "confidence": 0.42
    }
  ],
  "processing_time_ms": 45,
  "audio_duration_s": 2.0,
  "sample_rate": 16000,
  "error": null
}
```

## Algorithm (Phase 1 — Rule-Based)

The service extracts the following audio features:

- Log-mel spectrogram (64 mel bands)
- RMS energy
- Spectral centroid (brightness)
- Spectral flatness (noise-like vs tonal)
- High-frequency ratio (>4kHz)
- Onset detection (sharp transient impulses)

### Crash Sound Classes

The classifier identifies five crash-related sound types using feature heuristics:

- **car_bump** — sharp onsets + high RMS
- **glass_breaking** — high-frequency + flat spectrum
- **metal_impact** — high RMS + high spectral centroid
- **tire_screech** — sustained high-frequency + mel variance
- **explosion** — very high RMS + high mel energy

## Phase 6 (Future) — YAMNet Migration

The API contract is already compatible with a YAMNet-based implementation.

To upgrade:

1. Replace `classifier.py` with YAMNet TFLite inference.
2. Train on crash-specific audio datasets (NINA, MIVIA, Kaggle).
3. Keep the same API endpoints and response format.

No changes to the API or mobile app integration will be required.
