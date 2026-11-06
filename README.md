# Counterforce Strike Simulator

A web tool for the Berkeley Risk & Security Lab that illustrates how missile accuracy (CEP), weapon
effects (lethal radius), and salvo size interact against a field of hardened silos. It illustrates
uncertainty. It does **not** predict real outcomes.

> **Status: Phase 1.** This phase covers scaffolding, the control sidebar, and a map of silo
> locations. The simulation engine arrives in Phase 2.

## How to add a new base

1. Create `data/bases/<id>.json` by copying the template in [`data/README.md`](data/README.md).
2. Make sure `"id"` matches the filename. Set `"dataStatus"` to `"placeholder"` or `"verified"`.
3. Commit. The base appears in the dropdown automatically, and the map centres on its silos.

You don't need to change any code. See [`data/README.md`](data/README.md) for field definitions and tips.

## Repository layout

```
frontend/   Vite + React + TypeScript + Tailwind v4 + shadcn/ui + MapLibre
backend/    Minimal FastAPI app that serves data/bases (3 routes)
data/bases/ One JSON file per silo field: the only place data lives
scripts/    make_placeholder_grid.py (regenerates the synthetic Yumen grid)
render.yaml Render Blueprint (static site + web service)
```

## Local development

### Frontend (works on its own)

Requires Node 20.19+ or 22.12+.

```sh
cd frontend
npm install
npm run dev        # http://localhost:5173
```

With no `VITE_API_URL` set, the app reads `data/bases/*.json` directly at build time, so no
backend is needed. After adding a data file, reload the dev server so it picks the file up.

Other scripts: `npm run build`, `npm run lint`, `npm run format`, `npm run preview`.

### Backend (optional)

```sh
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8000
```

| Route                 | Returns                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| `GET /health`         | `{"status": "ok"}`                                                                 |
| `GET /api/bases`      | `[{ id, name, country, dataStatus, source, siloCount }]`. Rescans the folder on each request. |
| `GET /api/bases/{id}` | The file's full contents                                                           |

Env vars: `DATA_DIR` (default `../data/bases`) and `CORS_ORIGINS` (comma-separated, default
`http://localhost:5173`). Invalid files are skipped with a logged warning.

To point the frontend at it, put the following in `frontend/.env.local`:

```sh
VITE_API_URL=http://localhost:8000
```

Include the scheme. A bare host is assumed to be `https://`.

## Deploying (Render)

`render.yaml` defines both services. Create a Blueprint from the repo, then fill in the two
prompted values: `CORS_ORIGINS` on the API and `VITE_API_URL` on the static site. See the comments
in the file.

## Frontend architecture

- **Theme:** every colour, radius, and font lives in CSS variables in
  `frontend/src/index.css`. shadcn components read them, and so do the map paint colours. Files in
  `src/components/ui/` are shadcn-generated, so don't edit them by hand.
- **Data access:** `src/api/bases.ts` is the only module that knows where data comes from.
- **State:** `useSimulatorParams` (one reducer) holds all parameters and map options, and exposes
  `params`, which is fully validated or `null`. `usePanelState` holds the panel UI state separately.
- **Defaults and presets:** `src/config/defaults.ts`. These are placeholders, not vetted estimates.

## Notes

- **Basemaps:** "Light" is Esri World Light Gray Canvas. CARTO Positron was the original choice,
  but CARTO now requires an API key for its raster tiles. "Satellite" is Esri World Imagery.
- **Silo labels** use MapLibre's free demo glyph server (`demotiles.maplibre.org`). It needs no
  key but comes with no uptime guarantee.
- **TypeScript** is pinned to 6.0 because `typescript-eslint` doesn't support TS 7 yet.
