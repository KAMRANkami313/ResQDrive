from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import SERVICE_NAME, SERVICE_VERSION, DEFAULT_PORT
from .routers import health, analysis

app = FastAPI(
    title="ResQDrive Crash Sound Service",
    version=SERVICE_VERSION,
    description="AI-powered crash sound detection microservice",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analysis.router)


@app.get("/")
def root():
    return {
        "name": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "endpoints": ["/health", "/analyze"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)