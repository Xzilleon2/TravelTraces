# Production Docker Layout

Run from `backend/`:

```powershell
docker compose up --build
```

Scale API workers behind the Nginx web tier:

```powershell
docker compose up --build --scale api=2
```

Public entrypoint:

- Web/API/WebSocket proxy: `http://localhost:8080`
- Internal API service: `api:8000`

Set `WS_SESSION_SECRET` to a long random value before production.
