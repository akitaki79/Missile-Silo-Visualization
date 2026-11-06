# Silo field data

Every silo field ("base") is **one JSON file** in `data/bases/`. That's all there is to it.
Adding a file makes the base appear in the app's dropdown. You don't need to change any code.

## How to add a base

1. Copy the template below into a new file named `data/bases/<id>.json`. For example:
   `data/bases/hami.json`.
2. Fill in the fields. The `id` must exactly match the filename without `.json`.
3. Add one entry to `silos` for each silo.
4. Commit and push. The frontend and backend both pick the file up automatically.

To check your file locally, run the frontend (`cd frontend && npm run dev`) and pick your base
from the dropdown. The map centres itself on the average position of your silos.

## Template

```json
{
  "id": "example",
  "name": "Example Field",
  "country": "Country name",
  "dataStatus": "placeholder",
  "source": "Where these coordinates came from (citation or URL)",
  "silos": [
    { "id": "E001", "lat": 40.12345, "lon": 96.12345 },
    { "id": "E002", "lat": 40.13345, "lon": 96.14345 }
  ]
}
```

## Fields

| Field        | What it means                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `id`         | Short lowercase name with no spaces (letters, numbers, `-`). **Must match the filename.**            |
| `name`       | Display name shown in the app, e.g. `"Hanggin Banner"`.                                            |
| `country`    | Country operating the field.                                                                       |
| `dataStatus` | `"placeholder"` if the coordinates are approximate or made up, `"verified"` if they've been checked. |
| `source`     | Plain-text citation or URL. It's shown in the app's "Data sources" card.                           |
| `warheadsPerSilo` | *Optional.* Warheads carried by each silo's missile, used for "surviving warheads". If you leave it out, the app uses a per-country default (China: 3, per Lawrence 2026 Table 2 / DoD estimate), otherwise 1. |
| `silos`      | A list of silos. Each needs a unique `id` and decimal-degree `lat` / `lon`.                        |

## Rules and tips

- **Coordinates** are decimal degrees in WGS84 (the same as Google Maps). North and east are
  positive. South and west are negative. Five decimal places is about 1 m of precision, which is plenty.
- **Silo ids** only need to be unique within the file. A letter prefix plus a number (`H001`) works well.
- **`lat` comes before `lon`.** Swapping them is the most common mistake. If your base shows up in the
  wrong part of the world, check this first.
- Any base marked `"placeholder"` gets a visible **Placeholder data** badge in the app.
- The file must be valid JSON. That means no comments and no trailing commas. Paste it into a JSON
  validator if you're unsure.

## Converting a spreadsheet

If your coordinates are in a spreadsheet, export it as CSV, put it in `data/raw/`, and run:

```sh
python3 scripts/csv_to_base.py data/raw/<file>.csv --id <id> --name "<Name>" \
    --country "<Country>" --prefix <letter> --source "<citation>"
```

The CSV needs these columns: `Latitude`, `Longitude`, `Status`, `Structure Number`, and
`Type of Structure`. Only rows whose type is `Silo` are included. The script warns you if two silos
share the same coordinates. Extra fields such as `name` and `status` are kept in the JSON for reference.

`data/raw/` holds the original files. The app never reads them.

## Current files

- `yumen.json`: 119 silos converted from `raw/yumen-artifacts.csv` (the "Artifacts - Yumen"
  spreadsheet). It's marked `placeholder` until the source is cited and checked. **Silo 69 is
  excluded** (`--exclude "Silo 69"`) because the spreadsheet gives it the same coordinates as
  Silo 62. Add it back once corrected coordinates are available.
