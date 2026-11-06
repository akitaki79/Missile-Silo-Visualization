"""Minimal read-only API that serves the silo-field files in data/bases/.

Files are read on every request (no cache, no database), so dropping a new
JSON file into the data directory makes it available immediately.

Env vars:
  DATA_DIR      path to the bases directory (default: ../data/bases from this file)
  CORS_ORIGINS  comma-separated allowed origins (default: http://localhost:5173)
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

log = logging.getLogger("uvicorn.error")

DATA_DIR = Path(
    os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data" / "bases")
).resolve()
CORS_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]
BASE_ID = re.compile(r"^[a-z0-9][a-z0-9_-]*$")

app = FastAPI(title="Counterforce Simulator data API")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET"])


def load_base(path: Path) -> dict[str, Any] | None:
    """Parse one base file; return None (with a warning) if it's unusable."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or data.get("id") != path.stem:
            raise ValueError("'id' must match the filename")
        if not isinstance(data.get("silos"), list):
            raise ValueError("'silos' must be a list")
        return data
    except (OSError, ValueError) as exc:  # json.JSONDecodeError is a ValueError
        log.warning("Skipping invalid base file %s: %s", path.name, exc)
        return None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/bases")
def list_bases() -> list[dict[str, Any]]:
    summaries = []
    for path in sorted(DATA_DIR.glob("*.json")):
        base = load_base(path)
        if base is None:
            continue
        summaries.append(
            {
                "id": base["id"],
                "name": base.get("name", base["id"]),
                "country": base.get("country", ""),
                "dataStatus": base.get("dataStatus", "placeholder"),
                "source": base.get("source", ""),
                "siloCount": len(base["silos"]),
                "warheadsPerSilo": base.get("warheadsPerSilo"),
            }
        )
    return summaries


@app.get("/api/bases/{base_id}")
def get_base(base_id: str) -> dict[str, Any]:
    # The regex check also blocks path traversal (e.g. "../secrets").
    if not BASE_ID.match(base_id):
        raise HTTPException(status_code=404, detail="Base not found")
    path = DATA_DIR / f"{base_id}.json"
    base = load_base(path) if path.is_file() else None
    if base is None:
        raise HTTPException(status_code=404, detail="Base not found")
    return base
