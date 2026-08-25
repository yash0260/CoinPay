"""
CoinPay API — FastAPI application entry point.
Sets up CORS, mounts routes, and provides a health check.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import FRONTEND_URL
from app.routes import transactions, rewards

app = FastAPI(
    title="CoinPay API",
    description="Credit card bill payment, rewards & spending analytics",
    version="1.0.0",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(transactions.router)
app.include_router(rewards.router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "CoinPay API",
        "version": "1.0.0",
    }


@app.get("/api/health", tags=["Health"])
def api_health():
    """API health check."""
    return {"status": "ok"}
