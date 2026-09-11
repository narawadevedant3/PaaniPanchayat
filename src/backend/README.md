# PaaniPanchayat Backend

AI-Powered Water Sharing & Dispute Mediation Platform for Farmers - FastAPI Backend Service.

## Features & APIs
- **Optimization Engine**: OR-Tools based fair water allocation schedule generation
- **AI Dispute Resolution**: Agentic AI multi-tier dispute analysis & mediation (Powered by Gemini)
- **Water Requirement Estimator**: Dynamic crop water requirements calculation
- **Live Weather Integration**: Open-Meteo API integration for real-time weather & evapotranspiration metrics

## Deployment on Vercel

This repository is structured for seamless deployment on Vercel as a Serverless Python application.

1. Import this repository in your Vercel Dashboard (`CodeVortex8381/panipanchayat-backend`).
2. Configure Environment Variables if needed (e.g., `GOOGLE_API_KEY`).
3. Click **Deploy**.

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```
