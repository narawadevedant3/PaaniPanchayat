import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import router, reset_demo_data
from app.database import SessionLocal, Base, engine

# Initialize database schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        # Seed demo data on initial startup
        reset_demo_data(db)
        print("[SUCCESS] PaaniPanchayat Backend Initialized with 4 Demo Farms!")
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
