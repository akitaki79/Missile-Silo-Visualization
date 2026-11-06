import type { StyleSpecification } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Map, {
  Layer,
  Popup,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre'
import { MapControls } from '@/components/map/MapControls'
import { BASEMAPS, FIT_PADDING, GLYPHS_URL, LABEL_FONT } from '@/config/defaults'
import { bounds, lethalRings, silosToGeoJSON } from '@/lib/geo'
import { maplibregl } from '@/lib/maplibre'
import { cn } from '@/lib/utils'
import type { Base, BasemapId, MapOptions } from '@/types'

interface MapViewProps {
  base: Base | null
  /** Parsed lethal radius; undefined while the input is invalid (rings hidden). */
  lethalRadiusM?: number
  options: MapOptions
  /** Bump to make the map re-measure its container (after panel transitions). */
  resizeSignal: number
  /** Overlays rendered above the map, e.g. the stats strip. */
  children?: ReactNode
}

interface HoveredSilo {
  id: string
  lat: number
  lon: number
}

const BASEMAP_IDS = Object.keys(BASEMAPS) as BasemapId[]
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
// Leave room for the stats strip floating over the top edge.
const FIT_OPTIONS = {
  padding: { top: FIT_PADDING + 48, bottom: FIT_PADDING, left: FIT_PADDING, right: FIT_PADDING },
  maxZoom: 13,
}

export function MapView({ base, lethalRadiusM, options, resizeSignal, children }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState<HoveredSilo | null>(null)
  const [bearing, setBearing] = useState(0)
  const colors = useThemeColors()

  // Basemaps live in the base style; switching only toggles visibility, so
  // the silo layers added by <Source>/<Layer> are never torn down.
  const mapStyle = useMemo<StyleSpecification>(
    () => ({
      version: 8,
      glyphs: GLYPHS_URL,
      sources: Object.fromEntries(
        BASEMAP_IDS.map((id) => {
          const { tiles, tileSize, maxzoom, attribution } = BASEMAPS[id]
          return [`basemap-${id}`, { type: 'raster', tiles, tileSize, maxzoom, attribution }]
        }),
      ),
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': colors.background } },
        ...BASEMAP_IDS.map((id) => ({
          id: `basemap-${id}`,
          type: 'raster' as const,
          source: `basemap-${id}`,
          layout: { visibility: id === 'light' ? ('visible' as const) : ('none' as const) },
        })),
      ],
    }),
    [colors.background],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    for (const id of BASEMAP_IDS) {
      map
        .getMap()
        .setLayoutProperty(
          `basemap-${id}`,
          'visibility',
          id === options.basemap ? 'visible' : 'none',
        )
    }
  }, [options.basemap, ready])

  const fitToBase = useCallback(
    (animate = true) => {
      if (!base) return
      mapRef.current?.fitBounds(bounds(base.silos), {
        ...FIT_OPTIONS,
        duration: animate ? 700 : 0,
      })
    },
    [base],
  )

  // Auto-fit whenever the selected base changes. Jump on the first fit, animate after.
  const hasFitOnce = useRef(false)
  useEffect(() => {
    if (!ready || !base) return
    fitToBase(hasFitOnce.current)
    hasFitOnce.current = true
  }, [ready, base, fitToBase])

  useEffect(() => {
    mapRef.current?.resize()
  }, [resizeSignal])

  const silos = useMemo(() => (base ? silosToGeoJSON(base.silos) : EMPTY_FC), [base])
  const showRings = options.showRings && lethalRadiusM !== undefined
  const rings = useMemo(
    () => (base && showRings ? lethalRings(base.silos, lethalRadiusM) : EMPTY_FC),
    [base, showRings, lethalRadiusM],
  )

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties as HoveredSilo | undefined
    setHovered((prev) => (props?.id === prev?.id ? prev : (props ?? null)))
  }, [])

  return (
    <div
      className={cn('relative size-full', options.greyscale && '[&_.maplibregl-canvas]:grayscale')}
    >
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        onLoad={() => setReady(true)}
        onRotate={(e) => setBearing(e.viewState.bearing)}
        interactiveLayerIds={['silos-circle']}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovered(null)}
        cursor={hovered ? 'pointer' : 'grab'}
        attributionControl={{ compact: false }}
        dragRotate
        style={{ position: 'absolute', inset: 0 }}
      >
        <Source id="rings" type="geojson" data={rings}>
          <Layer
            id="rings-fill"
            type="fill"
            paint={{ 'fill-color': colors.ring, 'fill-opacity': 0.08 }}
          />
          <Layer
            id="rings-line"
            type="line"
            paint={{ 'line-color': colors.ring, 'line-width': 1.5, 'line-opacity': 0.9 }}
          />
        </Source>

        <Source id="silos" type="geojson" data={silos}>
          <Layer
            id="silos-circle"
            type="circle"
            paint={{
              'circle-color': colors.silo,
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 2.5, 10, 4.5, 14, 7],
              'circle-stroke-color': colors.siloStroke,
              'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 6, 0.5, 12, 1.5],
            }}
          />
          <Layer
            id="silos-label"
            type="symbol"
            layout={{
              visibility: options.showLabels ? 'visible' : 'none',
              'text-field': ['get', 'id'],
              'text-font': LABEL_FONT,
              'text-size': 11,
              'text-offset': [0, 0.9],
              'text-anchor': 'top',
              'text-allow-overlap': false,
            }}
            paint={{
              'text-color': colors.label,
              'text-halo-color': colors.labelHalo,
              'text-halo-width': 1.5,
            }}
          />
        </Source>

        {hovered && (
          <Popup
            longitude={hovered.lon}
            latitude={hovered.lat}
            anchor="bottom"
            offset={12}
            closeButton={false}
            closeOnClick={false}
          >
            <p className="text-sm font-semibold">{hovered.id}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {hovered.lat.toFixed(5)}°, {hovered.lon.toFixed(5)}°
            </p>
          </Popup>
        )}

        <ScaleControl position="bottom-left" unit="metric" maxWidth={120} />
      </Map>

      <MapControls
        mapRef={mapRef}
        onFit={() => fitToBase()}
        canFit={base !== null}
        bearing={bearing}
      />
      {children}
    </div>
  )
}

/** Map paint colours come from CSS variables so the theme stays in index.css. */
function useThemeColors() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement)
    const v = (name: string) => css.getPropertyValue(name).trim()
    return {
      background: v('--background'),
      silo: v('--map-silo'),
      siloStroke: v('--map-silo-stroke'),
      ring: v('--map-ring'),
      label: v('--map-label'),
      labelHalo: v('--map-label-halo'),
    }
  }, [])
}
