# VoyageAI

AI-powered travel planning and hotel booking platform.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local via MongoDB Compass)

### 1. Setup Backend
```bash
cd server
npm install
# Edit .env and add your GEMINI_API_KEY
npm run dev
```

### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

### Backend (`server/.env`)
- `MONGODB_URI` — Already set to `mongodb://localhost:27017/voyageai`
- `GEMINI_API_KEY` — Get free key at https://aistudio.google.com/
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Optional: Google OAuth
- `CLOUDINARY_*` — Optional: Avatar uploads
- `EMAIL_*` — Optional: Email verification (emails logged to console in dev)

### Frontend (`client/.env`)
- No changes needed for local dev

## Features
- ✈️ AI Trip Planner (Gemini)
- 🏨 Hotel Booking
- 🗺️ Interactive Maps (OpenStreetMap + Leaflet)
- 💰 Budget Planner
- 🤖 AI Travel Chatbot
- 📋 PDF Export
- 🔐 JWT Auth + Google OAuth

## API
Backend runs on http://localhost:5000
Frontend proxy: all `/api/*` calls forward to backend
