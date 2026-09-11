# 💧 PaaniPanchayat (पानीपंचायत)

> **"Fair Water. Peaceful Farming."**  
> Autonomous AI-Powered Water Sharing & Dispute Mediation Platform for Farmers  
> *(Problem Statement PS14: Autonomous Water-Sharing Dispute Mediation Agent)*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://paani-panchayat.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-FastAPI-green?style=flat-square&logo=fastapi)](https://api-paanipanchayat.onrender.com/docs)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue?style=flat-square)](https://paani-panchayat.vercel.app)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20मराठी%20%7C%20हिंदी-orange?style=flat-square)](https://paani-panchayat.vercel.app)

---

## 🔗 Quick Links

- **🌐 Live Web App (PWA):** [https://paani-panchayat.vercel.app](https://paani-panchayat.vercel.app)
- **⚡ Backend API Docs:** [https://api-paanipanchayat.onrender.com/docs](https://api-paanipanchayat.onrender.com/docs)

---

## 📌 Overview

**PaaniPanchayat** is an agentic water-management and mediation platform designed for farmers sharing a limited water source (canal, reservoir, or borewell). 

When total water demand exceeds supply, PaaniPanchayat:
1. **Estimates Water Needs** dynamically using crop type, growth stage, soil type, and live weather.
2. **Optimizes Fair Allocation** using deterministic mathematical constraints (Google OR-Tools).
3. **Mediates Farmer Disputes** through conversational AI agents (LangGraph) that explain decisions and negotiate fair compromises.

---

## ✨ Key Features

- 💧 **Farm-Level Water Estimation:** Accurately estimates irrigation needs based on crop stage, soil, and Open-Meteo weather data.
- ⚠️ **Automatic Conflict Detection:** Alerts administrators and farmers as soon as demand exceeds available water.
- ⚖️ **Deterministic Optimization (OR-Tools):** Guarantees that water limits and hard physical constraints are never violated.
- 🤝 **AI Dispute Mediation (LangGraph):** Allows farmers to object and negotiate compromises autonomously.
- 📱 **Mobile-First Installable PWA:** Works on any smartphone browser with direct home screen installation.
- 🗣️ **Multilingual Support:** Native support for English, मराठी (Marathi), and हिंदी (Hindi).
- 📜 **Transparent Audit Trail:** Every objection, mediation, and agreement revision is logged immutably.

---

## 🏗️ Architecture

```
[ Next.js 14 PWA (Farmer & Admin UI) ]
                 │
                 ▼ (REST / WebSockets)
[ FastAPI Backend (Python) ]
                 │
  ┌──────────────┴──────────────┐
  ▼                             ▼
[ LangGraph Agents ]     [ Google OR-Tools ]
(Mediation & Reasoning)  (Constraint Optimization)
  │                             │
  └──────────────┬──────────────┘
                 ▼
     [ PostgreSQL Database ]
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Recharts, Leaflet, PWA
- **Backend:** Python, FastAPI, Pydantic, WebSockets
- **AI & Agents:** LangGraph, GPT-5.6 / OpenAI API
- **Optimization:** Google OR-Tools (Linear & Constraint Programming)
- **Weather Data:** Open-Meteo API
- **Database:** PostgreSQL & SQLAlchemy

---

## 🚀 Quick Start & Local Setup

### 1. Backend (FastAPI + OR-Tools)

```bash
# Clone the repository
git clone https://github.com/narawadevedant3/PaaniPanchayat.git
cd PaaniPanchayat/backend

# Create virtual environment & install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
API docs available at: `http://localhost:8000/docs`

### 2. Frontend (Next.js PWA)

```bash
cd ../frontend

# Install dependencies & run development server
npm install
npm run dev
```
Open application at: `http://localhost:3000`

---

## 🧪 4-Farm Conflict Demo Scenario

| Farm | Farmer | Crop | Stage | Demand | Allocated | Fairness |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Farm A** | Ramesh | 🌾 Wheat | Flowering (Critical) | 83,640 L | 52,000 L | 82/100 |
| **Farm B** | Suresh | 🍅 Tomato | Fruit Development | 64,200 L | 42,000 L | 79/100 |
| **Farm C** | Ganesh | 🎋 Sugarcane | Vegetative | 78,000 L | 54,000 L | 84/100 |
| **Farm D** | Ananda | 🧅 Onion | Bulb Development | 39,160 L | 32,000 L | 81/100 |

*Available Water: **180,000 L** | Total Demand: **265,000 L** | Shortage: **85,000 L***

---

## 📄 License

This project is licensed under the MIT License.
