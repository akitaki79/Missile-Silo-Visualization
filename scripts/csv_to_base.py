#!/usr/bin/env python3
"""Convert a structures CSV (e.g. data/raw/yumen-artifacts.csv) into a base file.

Expected columns: Latitude, Longitude, Status, Structure Number, Type of Structure.
Only rows whose type is "Silo" become silos; other structures are skipped.
Silo ids are built from the structure number ("Silo 7" -> "Y007" with --prefix Y).
Each silo keeps its original name and construction status as extra fields.

Usage:
  python3 scripts/csv_to_base.py data/raw/yumen-artifacts.csv \\
      --id yumen --name Yumen --country China --prefix Y \\
      --source "Where the CSV came from" [--status placeholder|verified]

Standard library only. Prints warnings for duplicate coordinates.
"""

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

BASES_DIR = Path(__file__).resolve().parent.parent / "data" / "bases"


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("csv", type=Path)
    p.add_argument("--id", required=True, help="base id; also the output filename")
    p.add_argument("--name", required=True)
    p.add_argument("--country", required=True)
    p.add_argument("--prefix", required=True, help="silo id prefix, e.g. Y")
    p.add_argument("--source", required=True)
    p.add_argument("--status", choices=["placeholder", "verified"], default="placeholder")
    args = p.parse_args()

    silos = []
    skipped = defaultdict(int)
    with args.csv.open(encoding="utf-8-sig", newline="") as f:
        for line, row in enumerate(csv.DictReader(f), start=2):
            kind = row["Type of Structure"].strip()
            if kind.lower() != "silo":
                skipped[kind] += 1
                continue
            name = row["Structure Number"].strip()
            match = re.search(r"(\d+)\s*$", name)
            if not match:
                sys.exit(f"line {line}: can't find a number in structure name {name!r}")
            silos.append(
                {
                    "id": f"{args.prefix}{int(match.group(1)):03d}",
                    "lat": round(float(row["Latitude"]), 6),
                    "lon": round(float(row["Longitude"]), 6),
                    "name": name,
                    "status": row["Status"].strip(),
                }
            )

    silos.sort(key=lambda s: s["id"])
    ids = [s["id"] for s in silos]
    if len(set(ids)) != len(ids):
        sys.exit("duplicate silo numbers in CSV")

    by_coord = defaultdict(list)
    for s in silos:
        by_coord[(s["lat"], s["lon"])].append(s["name"])
    for coord, names in by_coord.items():
        if len(names) > 1:
            print(f"WARNING: {', '.join(names)} share coordinates {coord}", file=sys.stderr)

    base = {
        "id": args.id,
        "name": args.name,
        "country": args.country,
        "dataStatus": args.status,
        "source": args.source,
        "silos": silos,
    }
    out = BASES_DIR / f"{args.id}.json"
    out.write_text(json.dumps(base, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    skipped_desc = ", ".join(f"{n} {k}" for k, n in sorted(skipped.items())) or "none"
    print(f"Wrote {len(silos)} silos to {out} (skipped non-silo rows: {skipped_desc})")


if __name__ == "__main__":
    main()
