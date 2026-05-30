# 🅿️ Manipal Campus Smart Parking & Geofencing System

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](#)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](#)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy-D71F27.svg)](#)
[![Mapbox](https://img.shields.io/badge/Map-MapboxGL-3bb2d0.svg)](#)
[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/Jawknee-builds/parking-app)
[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Jawknee-builds/parking-app)
[![Deployment Frontend](https://img.shields.io/badge/Frontend%20Deploy-Vercel-000000.svg)](https://parking-ui-self.vercel.app)

A full-stack, secure smart campus parking orchestration and reservation system. Engineered for university campuses, the application coordinates GPS telemetry data from students' mobile devices against active campus parking geofences in real-time, utilizing exact bounding box checks to authorize parking sessions, paired with scheduled booking queues.

👉 **[Live Vercel Frontend UI Link](https://parking-ui-self.vercel.app)**
👉 **[Live Railway Backend API Link](https://manipal-parking-production.up.railway.app/docs)**

---

## 🏗️ Geofencing Bounding-Box Architecture

The system utilizes a lightweight, highly efficient **Bounding Box Geofencing check** in Python to verify whether a student is physically inside a designated parking zone. This check is far more cost-effective than standard polygonal intersection algorithms (like Ray-Casting) and runs in **$O(1)$ constant time complexity**, allowing the backend to evaluate thousands of concurrent telemetry dispatches per second.

### Mathematical Logic

Given a parking zone defined by diagonal coordinates:
- Bottom-Left coordinate: $(\text{min\_lat}, \text{min\_lon})$
- Top-Right coordinate: $(\text{max\_lat}, \text{max\_lon})$

A student's coordinates $(u_{\text{lat}}, u_{\text{lon}})$ are verified inside the boundaries if and only if:

$$\text{min\_lat} \le u_{\text{lat}} \le \text{max\_lat} \quad \land \quad \text{min\_lon} \le u_{\text{lon}} \le \text{max\_lon}$$

### Telemetry Authorization Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (React App)
    participant API as FastAPI Gateway
    database DB as SQLite / PostgreSQL
    
    Student->>API: POST /park (zone_id, user_lat, user_lon) with JWT
    API->>DB: Fetch Zone coordinate boundaries (min/max lat/lon)
    DB-->>API: Zone bounds coordinates
    Note over API: Bounding Box check:<br/>min_lat <= user_lat <= max_lat AND<br/>min_lon <= user_lon <= max_lon
    alt Inside Geofence
        API-->>Student: 🟢 HTTP 200 (Access Authorized, Session Started)
    else Outside Geofence
        API-->>Student: 🔴 HTTP 200 (Access Denied: Location Verification Failed)
    end
```

---

## 🎨 Frontend UI Highlights

The frontend has been polished into a premium dark-themed dashboard featuring:
- **Pulsing GPS Telemetry Simulator**: An interactive sidebar telemetry tool allowing users to slide and adjust simulated GPS coordinates, showing a pulsing blue dot on a Mapbox dark visual theme.
- **Immediate Geofence Authorizer**: Allows students to test geofencing boundaries and inspect instant visual feedback banners indicating verified access or boundaries rejection.
- **Campus Scheduler**: An inline datetime booking panel connecting to PostgreSQL/SQLite tables for future reservation queuing.

---

## 🚀 Running Locally & Seeding

### 1. Backend Server (FastAPI)
1. Navigate to the root folder:
   ```bash
   cd parking-app
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   *Note: On startup, the server automatically detects if the SQLite database (`parking.db`) is empty and seeds it with 4 realistic campus parking zones and telemetry geofences.*

### 2. Frontend Dashboard (React)
1. Navigate to the UI folder:
   ```bash
   cd parking-ui
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the React server:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` to interact with the application.

---

## 🌩️ Production Deployment Guide

### Backend: Render (100% Free, NO Credit Card Required 🌟)
1. Click the **Deploy to Render** button above or log into the [Render Dashboard](https://dashboard.render.com).
2. Choose **Web Service** and link your `parking-app` repository.
3. Vercel/Render will auto-detect your project. On startup, the server automatically boots SQLite.
4. Click **Deploy**.

### Backend: Railway
- Mount your repository to **Railway**.
- Set the environment variables:
  - `DATABASE_URL` = (Your Railway PostgreSQL Connection URI)
- The server will automatically build the tables on the Postgres volume on startup!

### Frontend: Vercel
- Connect the `parking-ui` subdirectory to **Vercel**.
- Add the Environment Variable:
  - `REACT_APP_API_URL` = `https://your-backend-render-or-railway-url.onrender.com`
- Deploy!

---
*Developed with 💜 by [Jawknee-builds](https://github.com/Jawknee-builds)*
