import numpy as np
from scipy import signal
from scipy.fft import rfft, rfftfreq


def compute_mel_spectrogram(
    samples: np.ndarray,
    sample_rate: int = 16000,
    n_fft: int = 512,
    hop_length: int = 256,
    n_mels: int = 64,
) -> np.ndarray:
    if samples.size == 0:
        return np.zeros((n_mels, 0), dtype=np.float32)
    if samples.dtype != np.float32:
        samples = samples.astype(np.float32)

    window = np.hanning(n_fft).astype(np.float32)
    num_frames = 1 + (len(samples) - n_fft) // hop_length
    if num_frames < 1:
        padded = np.zeros(n_fft, dtype=np.float32)
        padded[: len(samples)] = samples
        frames = padded.reshape(1, -1)
        num_frames = 1
    else:
        frames = np.lib.stride_tricks.as_strided(
            samples,
            shape=(num_frames, n_fft),
            strides=(samples.strides[0] * hop_length, samples.strides[0]),
        )

    windowed = frames * window
    spectrum = np.abs(rfft(windowed, axis=1))

    mel_filters = _mel_filterbank(sample_rate, n_fft, n_mels)
    mel_spec = mel_filters @ spectrum.T
    mel_spec = np.maximum(mel_spec, 1e-10)
    log_mel = 10.0 * np.log10(mel_spec)
    return log_mel.astype(np.float32)


def _mel_filterbank(sample_rate: int, n_fft: int, n_mels: int) -> np.ndarray:
    f_min = 0.0
    f_max = sample_rate / 2.0
    mel_min = _hz_to_mel(f_min)
    mel_max = _hz_to_mel(f_max)
    mel_points = np.linspace(mel_min, mel_max, n_mels + 2)
    hz_points = _mel_to_hz(mel_points)
    freqs = np.linspace(0, sample_rate / 2.0, n_fft // 2 + 1)
    filters = np.zeros((n_mels, n_fft // 2 + 1), dtype=np.float32)
    for m in range(n_mels):
        left = hz_points[m]
        center = hz_points[m + 1]
        right = hz_points[m + 2]
        for i, f in enumerate(freqs):
            if left <= f <= center:
                filters[m, i] = (f - left) / max(center - left, 1e-10)
            elif center < f <= right:
                filters[m, i] = (right - f) / max(right - center, 1e-10)
    return filters


def _hz_to_mel(hz: float) -> float:
    return 2595.0 * np.log10(1.0 + hz / 700.0)


def _mel_to_hz(mel: float) -> float:
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)


def compute_rms_energy(samples: np.ndarray) -> float:
    if samples.size == 0:
        return 0.0
    return float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))


def compute_spectral_centroid(
    samples: np.ndarray, sample_rate: int
) -> np.ndarray:
    if samples.size == 0:
        return np.array([0.0])
    spectrum = np.abs(rfft(samples))
    freqs = rfftfreq(len(samples), 1.0 / sample_rate)
    total = np.sum(spectrum)
    if total < 1e-10:
        return np.array([0.0])
    centroid = np.sum(freqs * spectrum) / total
    return np.array([centroid])


def detect_onsets(samples: np.ndarray, sample_rate: int) -> np.ndarray:
    if samples.size < 2:
        return np.array([])
    window_size = int(sample_rate * 0.02)
    if window_size < 2:
        window_size = 2
    num_windows = len(samples) // window_size
    if num_windows < 2:
        return np.array([])
    frames = samples[: num_windows * window_size].reshape(num_windows, window_size)
    rms = np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1))
    if rms.size < 2:
        return np.array([])
    diff = np.diff(rms)
    threshold = np.std(diff) * 3.0
    onset_indices = np.where(diff > threshold)[0]
    onset_times = onset_indices * (window_size / sample_rate)
    return onset_times


def compute_spectral_flatness(samples: np.ndarray) -> float:
    if samples.size == 0:
        return 0.0
    spectrum = np.abs(rfft(samples)) + 1e-10
    geo_mean = np.exp(np.mean(np.log(spectrum)))
    arith_mean = np.mean(spectrum)
    if arith_mean < 1e-10:
        return 0.0
    return float(geo_mean / arith_mean)


def detect_high_frequency_content(
    samples: np.ndarray, sample_rate: int, threshold_hz: float = 4000.0
) -> float:
    if samples.size == 0:
        return 0.0
    spectrum = np.abs(rfft(samples))
    freqs = rfftfreq(len(samples), 1.0 / sample_rate)
    high_mask = freqs >= threshold_hz
    total_energy = np.sum(spectrum) + 1e-10
    high_energy = np.sum(spectrum[high_mask])
    return float(high_energy / total_energy)