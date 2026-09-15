# Welcome Training Portal

A web application to digitize the welcome training / onboarding tracker for the Release Management organization. It replaces the Excel-based onboarding tracker with a centralized portal where:

- **Admins** manage Managers and the organizational structure (towers and teams).
- **Managers** enroll New Joiners, maintain a library of Training Modules, assign modules to their New Joiners, track progress, view reports, and review feedback.
- **New Joiners** complete their assigned training, mark progress, and rate the modules they finish.

## Tech Stack

- **Backend:** Python 3.14, FastAPI, PyMongo (MongoDB)
- **Frontend:** React 19 (Vite + TypeScript), MUI v9, react-router-dom v7
- **Auth:** JWT (bearer tokens) with role-based access control (`admin`, `manager`, `new_joiner`)
- **Database:** MongoDB Community 8.x

## Project Layout

```
backend/
  app/             FastAPI application (schemas, services, api routers, core)
  scripts/seed.py  Demo seed data
  requirements.txt
frontend/
  src/             React app (pages, api client, types, theme, contexts)
```

## Prerequisites

- Node.js 20+ and npm
- MongoDB Community (running on `localhost:27017`)
- Python 3.10+

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # adjust MONGO_URI / JWT_SECRET if needed
```

### Seed demo data

```bash
PYTHONPATH=. .venv/bin/python scripts/seed.py
```

This creates towers/teams, demo accounts, 25 training modules, assignments, and feedback.

### Run the API

```bash
cd backend
PYTHONPATH=. .venv/bin/uvicorn app.main:app --port 8000
```

API is served at `http://localhost:8000/api/v1`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to `http://localhost:8000`, so no CORS issues in development.

## Demo Accounts

| Role       | Username       | Password    |
|------------|----------------|-------------|
| Admin      | `admin`        | `Admin@123` |
| Manager    | `priya.raman`  | `Manager@123` |
| Manager    | `james.okafor` | `Manager@123` |
| Manager    | `elena.vasquez`| `Manager@123` |
| New Joiner | `aisha.khan`   | `Joiner@123` |

(8 New Joiners total — see `backend/scripts/seed.py`; all use `Joiner@123`.)

## Key API Endpoints

`/api/v1/auth`, `/api/v1/towers`, `/api/v1/teams`, `/api/v1/admin/*`, `/api/v1/joiners`,
`/api/v1/training-modules`, `/api/v1/assignments`, `/api/v1/feedback`, `/api/v1/reports`, `/api/v1/me/*`.

## Production Notes (V1 scope)

- V1 deliberately omits: assessments/quizzes, forums, AI features, Percipio API integration, SSO/Okta.
- Reports CSV export works via the authenticated API (JWT required).
- For production, run the built frontend (`npm run build` → `dist/`) behind the same origin as the API or configure CORS/HTTPS, and keep `JWT_SECRET` out of source control.