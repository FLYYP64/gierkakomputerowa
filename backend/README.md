# Leaderboard API

## Local startup

```sh
cd backend
npm install
node server.js
```

The API listens on port `3000` and creates `backend/scores.db` automatically.

## Docker

From the project root, run:

```sh
docker compose up -d --build
```

The container listens on port `3000`; SQLite data persists in `./data/scores.db`.

## Endpoints

- `GET /api/scores` returns the top 10 by distance, descending.
- `GET /api/scores?sort=debt` returns the top 10 by debt, descending.
- `POST /api/scores` accepts JSON with `nickname`, `debt`, and `distance` and returns the created record with status `201`.
- `GET /healthz` is a simple health check.

Set `CORS_ORIGIN` to `*` (the default) or a comma-separated list of allowed origins. In `index.html`, replace `API_URL` with the publicly reachable HTTPS address of this API.
