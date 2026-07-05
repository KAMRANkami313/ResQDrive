from fastapi import APIRouter
from ..models import HealthResponse
from ..config import SERVICE_NAME, SERVICE_VERSION

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
@router.get("/", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        model_loaded=True,
    )