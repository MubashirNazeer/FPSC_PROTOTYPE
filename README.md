# FPSC Digitalization ERP — MVP

Full-stack prototype aligned to **RFP FPSC/PISC/SW/2026/01**.

## Docker (recommended)

Clone, then:

```bash
docker compose up --build
```

| Surface | URL |
|---------|-----|
| **Frontend** | http://localhost:8888 |
| Staff login | http://localhost:8888/staff/login |
| Candidate portal | http://localhost:8888/portal/login |
| API docs | http://localhost:8000/api/docs/ |

LAN access: use your machine IP, e.g. `http://192.168.x.x:8888` (API is proxied through the frontend).

Stop:

```bash
docker compose down
```

Reset DB + reseed:

```bash
docker compose down -v
docker compose up --build
```

## Demo accounts

Password for all users: **`Fpsc@2026`**

| Username | Role |
|----------|------|
| `admin` | Superuser / IT |
| `rr.officer` | R&R |
| `secrecy` | Secrecy |
| `ce.officer` | CE Wing |
| `invigilator` | CBT invigilator |
| `candidate1` / `candidate2` | Candidates |

## Local (without Docker)

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Default local frontend: http://localhost:3000 (API rewrites to `:8000`).

## Surfaces

- **Public website** `/`
- **Candidate portal** `/portal/*`
- **Staff EMS** `/staff/*`
- **CBT exam** `/cbt/exam/[sessionId]`

## RFP mapping

See [docs/RFP_TRACEABILITY.md](docs/RFP_TRACEABILITY.md) and [docs/MOM_FPSC_MVP.md](docs/MOM_FPSC_MVP.md).
