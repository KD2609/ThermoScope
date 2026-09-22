# Production Deployment Guide

ThermoScope AI is engineered to be cloud-agnostic and deployable across modern container, serverless, and PaaS architectures.

---

## 1. Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 14+ with PostGIS Extension** (or managed PostgreSQL on Supabase, AWS RDS, Neon, or Render)
- **NASA FIRMS MAP_KEY** (Register for a free key at [NASA FIRMS Map Key](https://firms.modaps.eosdis.nasa.gov/api/map_key/))

---

## 2. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Key production variables:
```env
ENVIRONMENT=production
DEBUG=False
DATABASE_URL=postgresql://user:password@your-postgres-host:5432/thermoscope
NASA_FIRMS_MAP_KEY=your_registered_nasa_firms_key
FIRMS_SOURCE=VIIRS_SNPP_NRT
FIRMS_BBOX=68.0,6.0,97.5,37.5
POLL_INTERVAL_MINUTES=15
```

---

## 3. Backend Deployment (Render / Railway / AWS / Docker)

### Running with Uvicorn:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Dockerfile (Backend):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 4. Frontend Deployment (Vercel / Cloudflare Pages / Netlify)

1. Build the production assets:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. The output bundle will be located in `frontend/dist`.
3. For Vercel or Netlify, set the build command to `npm run build` and output directory to `dist`.
4. Configure the API proxy or environment variable `VITE_API_BASE_URL` pointing to your backend server URL.

---

## 5. Background Worker Daemon

To run the NASA FIRMS ingestion worker independently of the web server:
```bash
python data-ingestion/firms_ingestion.py --interval 15
```
