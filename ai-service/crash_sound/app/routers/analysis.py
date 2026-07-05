import io
import time
import wave
from typing import Optional

import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException

from ..classifier import classify_audio
from ..config import MAX_AUDIO_DURATION_SECONDS, SAMPLE_RATE, CONFIDENCE_THRESHOLD
from ..models import CrashSoundResponse

router = APIRouter(prefix="/analyze", tags=["analysis"])


def _decode_wav(file_bytes: bytes) -> tuple[np.ndarray, int]:
    try:
        with wave.open(io.BytesIO(file_bytes), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            n_frames = wf.getnframes()
            raw = wf.readframes(n_frames)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid WAV file: {e}")

    if sampwidth == 1:
        samples = np.frombuffer(raw, dtype=np.uint8).astype(np.float32)
        samples = (samples - 128) / 128.0
    elif sampwidth == 2:
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sampwidth == 4:
        samples = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported sample width: {sampwidth}")

    if n_channels > 1:
        samples = samples[::n_channels]

    return samples, framerate


def _decode_raw_pcm(file_bytes: bytes) -> tuple[np.ndarray, int]:
    samples = np.frombuffer(file_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    return samples, SAMPLE_RATE


@router.post("", response_model=CrashSoundResponse)
@router.post("/", response_model=CrashSoundResponse)
async def analyze_audio(file: UploadFile = File(...)):
    start = time.time()
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()

    try:
        if filename.endswith(".wav") or content_type == "audio/wav":
            samples, sample_rate = _decode_wav(file_bytes)
        else:
            samples, sample_rate = _decode_raw_pcm(file_bytes)
    except HTTPException:
        raise
    except Exception as e:
        return CrashSoundResponse(
            is_crash=False,
            confidence=0.0,
            detected_classes=[],
            processing_time_ms=int((time.time() - start) * 1000),
            audio_duration_s=0.0,
            sample_rate=SAMPLE_RATE,
            error=f"Decode failure: {e}",
        )

    if samples.size == 0:
        return CrashSoundResponse(
            is_crash=False,
            confidence=0.0,
            detected_classes=[],
            processing_time_ms=int((time.time() - start) * 1000),
            audio_duration_s=0.0,
            sample_rate=SAMPLE_RATE,
            error="No audio samples decoded",
        )

    duration_s = samples.size / sample_rate
    if duration_s > MAX_AUDIO_DURATION_SECONDS:
        max_samples = int(MAX_AUDIO_DURATION_SECONDS * sample_rate)
        samples = samples[:max_samples]
        duration_s = MAX_AUDIO_DURATION_SECONDS

    is_crash, confidence, predictions = classify_audio(samples, sample_rate)
    if confidence >= CONFIDENCE_THRESHOLD and not is_crash:
        is_crash = True

    elapsed_ms = int((time.time() - start) * 1000)
    return CrashSoundResponse(
        is_crash=is_crash,
        confidence=confidence,
        detected_classes=predictions,
        processing_time_ms=elapsed_ms,
        audio_duration_s=round(duration_s, 3),
        sample_rate=sample_rate,
        error=None,
    )