# 🅿️ Smart Campus Parking & Geofencing System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy-D71F27.svg?style=flat-square&logo=sqlalchemy)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> Low-latency reservation, automated slot allocation, and spatial geofencing system built to eliminate parking bottlenecks across multi-zone campus hubs.

---

## ⚡ Core Capabilities

- **Real-Time Slot Ingestion**: WebSocket and REST polling endpoints reporting occupancy state per zone.
- **Geofenced Arrival Detection**: Auto-validates vehicle presence within perimeter radii to reduce gate friction.
- **Role-Based Access Control**: Granular permissions for students, faculty, visitors, and facility staff.
- **Historical Occupancy Analytics**: Generates peak utilization curves to optimize allocation rules.

---

## 🛠 Tech Stack

- **API Layer**: FastAPI (Python 3.11+), Pydantic v2 schemas
- **Database & Persistence**: SQLAlchemy 2.0 ORM, PostgreSQL / SQLite driver compatibility
- **UI Console**: React 19, Tailwind CSS, Map visualization hooks
- **Authentication**: JWT token exchange with bcrypt password hashing

---

## 🚀 Quickstart

### Backend Setup
```bash
git clone https://github.com/Jawknee-builds/parking-app.git
cd parking-app

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 create_db.py
uvicorn main:app --reload --port 8000
```
Interactive API docs available at `http://127.0.0.1:8000/docs`.
