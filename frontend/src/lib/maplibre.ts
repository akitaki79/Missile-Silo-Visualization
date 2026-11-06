import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

/*
 * MapLibre v6 locates its worker via `new URL('./maplibre-gl-worker.mjs', import.meta.url)`,
 * which breaks once Vite pre-bundles the library. `?worker&url` has Vite treat the file
 * as a worker entry and hand back its URL, in dev and in builds.
 *
 * MapView passes this same instance to <Map mapLib>, so react-map-gl can't lazily
 * load a second, unconfigured copy.
 */
maplibregl.setWorkerUrl(workerUrl)

export { maplibregl }
