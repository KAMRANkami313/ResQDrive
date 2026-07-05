from pydantic import BaseModel, Field
from typing import List, Optional


class CrashSoundRequest(BaseModel):
    pass


class SoundClassPrediction(BaseModel):
    label: str = Field(..., description="Detected sound class label")
    confidence: float = Field(..., ge=0.0, le=1.0)


class CrashSoundResponse(BaseModel):
    is_crash: bool = Field(..., description="Whether a crash sound was detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    detected_classes: List[SoundClassPrediction] = Field(default_factory=list)
    processing_time_ms: int = Field(..., description="Processing time in ms")
    audio_duration_s: float = Field(..., description="Audio duration in seconds")
    sample_rate: int = Field(..., description="Sample rate used")
    error: Optional[str] = Field(None, description="Error message if any")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool