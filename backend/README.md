# TravelPlaces Backend

FastAPI backend for Phase I mapping services.

## Run locally

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Phase I endpoints

- `GET /health`
- `GET /api/search?query=Manila&limit=8`
- `GET /api/reverse?lat=14.5995&lon=120.9842`
- `POST /api/route`
- `POST /api/routes/driving`
- `POST /api/tracking/sessions`
- `POST /api/tracking/token`
- `WS /ws/{session_id}?token=...`
