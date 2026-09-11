import sys
import os
# Ensure the backend directory is in sys.path so 'app' imports work from any working directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import router, reset_demo_data
from app.database import SessionLocal, Base, engine
from app import models
from contextlib import asynccontextmanager

# Initialize database schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        farm_count = db.query(models.Farm).count()
        if user_count == 0 or farm_count == 0:
            reset_demo_data(db)
            print("[SUCCESS] PaaniPanchayat Backend Initialized and Seeded with 4 Demo Farms!")
        else:
            print(f"[SUCCESS] PaaniPanchayat Backend Initialized with {user_count} users and {farm_count} farms from database.")
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

@app.get("/")
def root():
    return {
        "platform": "PaaniPanchayat",
        "tagline": "Fair Water. Peaceful Farming.",
        "status": "Online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
