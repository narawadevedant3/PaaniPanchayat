import sys
from pathlib import Path

# Ensure src/backend is on sys.path for both local uvicorn and Vercel serverless imports
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import router, init_server_state, reset_demo_data
from app.database import SessionLocal, Base, engine
from app import models

# Initialize database schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        init_server_state(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="PaaniPanchayat API",
    description="AI-Powered Water Sharing & Dispute Mediation Platform for Farmers",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local & Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/api")
def api_root():
    return {
        "platform": "PaaniPanchayat",
        "tagline": "Fair Water. Peaceful Farming.",
        "status": "Online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
