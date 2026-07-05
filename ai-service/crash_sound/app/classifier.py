import numpy as np
from typing import List, Tuple
from .feature_extractor import (
    compute_mel_spectrogram,
    compute_rms_energy,
    compute_spectral_centroid,
    detect_onsets,
    compute_spectral_flatness,
    detect_high_frequency_content,
)
from .models import SoundClassPrediction


CRASH_LABELS = ["car_bump", "glass_breaking", "metal_impact", "tire_screech", "explosion"]


def classify_audio(samples: np.ndarray, sample_rate: int) -> Tuple[bool, float, List[SoundClassPrediction]]:
    if samples.size == 0:
        return False, 0.0, []

    samples_f = samples.astype(np.float32)
    if np.max(np.abs(samples_f)) > 0:
        samples_f = samples_f / np.max(np.abs(samples_f))

    rms = compute_rms_energy(samples_f)
    centroid = float(compute_spectral_centroid(samples_f, sample_rate)[0])
    flatness = compute_spectral_flatness(samples_f)
    high_freq_ratio = detect_high_frequency_content(samples_f, sample_rate)
    onsets = detect_onsets(samples_f, sample_rate)
    mel_spec = compute_mel_spectrogram(samples_f, sample_rate)
    mel_energy = float(np.mean(mel_spec)) if mel_spec.size > 0 else 0.0
    mel_variance = float(np.var(mel_spec)) if mel_spec.size > 0 else 0.0

    scores: dict[str, float] = {label: 0.0 for label in CRASH_LABELS}

    if rms > 0.05 and len(onsets) > 0:
        sharp_onset_score = min(1.0, len(onsets) / 3.0) * min(1.0, rms / 0.3)
        scores["car_bump"] = max(scores["car_bump"], sharp_onset_score * 0.7)

    if high_freq_ratio > 0.25 and flatness > 0.15:
        glass_score = min(1.0, high_freq_ratio / 0.5) * min(1.0, flatness / 0.3)
        scores["glass_breaking"] = max(scores["glass_breaking"], glass_score * 0.85)

    if rms > 0.1 and centroid > 1500:
        metal_score = min(1.0, rms / 0.4) * min(1.0, centroid / 3000.0)
        scores["metal_impact"] = max(scores["metal_impact"], metal_score * 0.8)

    if high_freq_ratio > 0.3 and mel_variance > 50:
        screech_score = min(1.0, high_freq_ratio / 0.4) * min(1.0, mel_variance / 100.0)
        scores["tire_screech"] = max(scores["tire_screech"], screech_score * 0.7)

    if rms > 0.3 and mel_energy > 30:
        explosion_score = min(1.0, rms / 0.6) * min(1.0, mel_energy / 50.0)
        scores["explosion"] = max(scores["explosion"], explosion_score * 0.6)

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    predictions: List[SoundClassPrediction] = [
        SoundClassPrediction(label=label, confidence=round(conf, 4))
        for label, conf in sorted_scores
        if conf > 0.05
    ]

    top_confidence = predictions[0].confidence if predictions else 0.0
    is_crash = top_confidence >= 0.6 and rms > 0.05

    return is_crash, round(top_confidence, 4), predictions