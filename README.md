# FPSC Digitalization ERP — MVP

Full-stack prototype aligned to **RFP FPSC/PISC/SW/2026/01** (Software Development Services for Digitalization of In-House Processes and Automation of Examination System of FPSC).

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5 + DRF, SimpleJWT, Celery, PostgreSQL (SQLite for local demo) |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Integrations | Mock NADRA / Payment / SMS adapters |

## Quick start (local)

### Backend

```powershell
cd FPSC_PROTOTYPE
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8000
```

API docs: http://localhost:8000/api/docs/

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

### Docker (optional)

```powershell
docker compose up --build
```

## Demo accounts

Password for all users: **`Fpsc@2026`**

| Username | Role |
|----------|------|
| `admin` | Superuser / IT |
| `ts.officer` | T&S |
| `rr.officer` | R&R |
| `commission` | Commission |
| `secrecy` | Secrecy |
| `ce.officer` | CE Wing |
| `author` / `reviewer` / `approver` | QDBMS |
| `invigilator` | CBT invigilator |
| `candidate1` / `candidate2` | Candidates |

## Surfaces

- **Public website** `/` — brand, notices, ads
- **Candidate portal** `/portal/*` — register, apply, pay fee, admit card
- **Staff EMS** `/staff/*` — GR, CE, UEM, QDB, CBT, Supporting, CMS
- **CBT exam** `/cbt/exam/[sessionId]` — timed exam + invigilator board

## Seeded demo path

1. Login as `candidate1` → Portal → Applications → Admit card  
2. Login as `admin` → Staff dashboard → GR requisitions → Advance  
3. Staff → QDB → papers → dual authorize (secrecy + approver already done in seed)  
4. Staff → CBT → open invigilator board for live sitting  
5. Login as `candidate1` → CBT → start enrolled session  

## RFP mapping

See [docs/RFP_TRACEABILITY.md](docs/RFP_TRACEABILITY.md).

## Project layout

```
backend/     Django project + domain apps
frontend/    Next.js multi-surface UI
docs/        Traceability & notes
docker-compose.yml
```
