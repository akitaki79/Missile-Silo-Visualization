import circle from '@turf/circle'
import type { ExpressionSpecification, SkySpecification, StyleSpecification } from 'maplibre-gl'
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
import { MapLegend } from '@/components/map/MapLegend'
import {
  BASEMAPS,
  DEFAULT_MAP_OPTIONS,
  FIT_PADDING,
  GLYPHS_URL,
  LABEL_FONT,
  VOLLEY_COLOR_SLOTS,
} from '@/config/defaults'
import type { DisplayImpact, SiloDisplayState } from '@/hooks/useSimulation'
import { bounds, distanceM, impactsToGeoJSON, lethalRings, silosToGeoJSON } from '@/lib/geo'
import { maplibregl } from '@/lib/maplibre'
import { cn } from '@/lib/utils'
import type { Base, BasemapId, MapOptions } from '@/types'

interface MapViewProps {
  base: Base | null
  /** Parsed lethal radius; undefined while the input is invalid (rings hidden). */
  lethalRadiusM?: number
  options: MapOptions
  /** Per-silo simulation state (index-aligned with base.silos); null before a run. */
  siloStates: SiloDisplayState[] | null
  impacts: DisplayImpact[]
  /** Lethal radius the current run used, for the impact hover ring. */
  runLethalRadiusM?: number
  /** Number of volleys with impacts on screen, for the legend. */
  volleysShown: number
  /** Bump to make the map re-measure its container (after panel transitions). */
  resizeSignal: number
  /** Overlays rendered above the map, e.g. the stats strip. */
  children?: ReactNode
}

type Hovered =
  | { kind: 'silo'; id: string; lat: number; lon: number; state: string }
  | { kind: 'impact'; impact: DisplayImpact }

const BASEMAP_IDS = Object.keys(BASEMAPS) as BasemapId[]
const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
// Leave room for the stats strip floating over the top edge.
const FIT_OPTIONS = {
  padding: { top: FIT_PADDING + 48, bottom: FIT_PADDING, left: FIT_PADDING, right: FIT_PADDING },
  maxZoom: 13,
}
const SILO_STATE_LABEL: Record<string, string> = {
  intact: 'Intact',
  destroyed: 'Destroyed',
  untargeted: 'Intact · not targeted this volley',
}

export function MapView({
  base,
  lethalRadiusM,
  options,
  siloStates,
  impacts,
  runLethalRadiusM,
  volleysShown,
  resizeSignal,
  children,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState<Hovered | null>(null)
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
          layout: {
            visibility:
              id === DEFAULT_MAP_OPTIONS.basemap ? ('visible' as const) : ('none' as const),
          },
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

  const silos = useMemo(
    () => (base ? silosToGeoJSON(base.silos, siloStates) : EMPTY_FC),
    [base, siloStates],
  )
  const showRings = options.showRings && lethalRadiusM !== undefined
  const rings = useMemo(
    () => (base && showRings ? lethalRings(base.silos, lethalRadiusM) : EMPTY_FC),
    [base, showRings, lethalRadiusM],
  )
  const impactsFc = useMemo(
    () => (options.showImpacts ? impactsToGeoJSON(impacts, VOLLEY_COLOR_SLOTS) : EMPTY_FC),
    [impacts, options.showImpacts],
  )
  const impactByKey = useMemo(() => new globalThis.Map(impacts.map((m) => [m.key, m])), [impacts])

  // Hovering an impact: its lethal-radius circle and a line back to its aim point.
  const hoverImpact = hovered?.kind === 'impact' ? hovered.impact : null
  const hoverGeometry = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!hoverImpact) return EMPTY_FC
    const features: GeoJSON.Feature[] = [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [hoverImpact.lon, hoverImpact.lat],
            [hoverImpact.aimLon, hoverImpact.aimLat],
          ],
        },
      },
    ]
    if (runLethalRadiusM)
      features.push(
        circle([hoverImpact.lon, hoverImpact.lat], runLethalRadiusM / 1000, {
          steps: 64,
          units: 'kilometers',
        }),
      )
    return { type: 'FeatureCollection', features }
  }, [hoverImpact, runLethalRadiusM])

  const onMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]
      if (!f) return setHovered(null)
      if (f.layer.id === 'impacts-circle') {
        const impact = impactByKey.get(String(f.properties.key))
        setHovered((prev) =>
          prev?.kind === 'impact' && prev.impact.key === impact?.key
            ? prev
            : impact
              ? { kind: 'impact', impact }
              : null,
        )
      } else {
        const p = f.properties as { id: string; lat: number; lon: number; state: string }
        setHovered((prev) =>
          prev?.kind === 'silo' && prev.id === p.id && prev.state === p.state
            ? prev
            : { kind: 'silo', ...p },
        )
      }
    },
    [impactByKey],
  )

  const volleyColor: ExpressionSpecification = [
    'match',
    ['get', 'slot'],
    1,
    colors.viz1,
    2,
    colors.viz2,
    3,
    colors.viz3,
    colors.vizOther,
  ]

  return (
    <div
      className={cn(
        'relative size-full bg-map-space',
        options.greyscale && '[&_.maplibregl-canvas]:grayscale',
      )}
    >
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        projection={options.projection}
        sky={SKY}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        onLoad={() => setReady(true)}
        onRotate={(e) => setBearing(e.viewState.bearing)}
        interactiveLayerIds={['impacts-circle', 'silos-circle']}
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
              'circle-color': [
                'match',
                ['get', 'state'],
                'destroyed',
                colors.siloDestroyed,
                'untargeted',
                colors.siloUntargeted,
                colors.silo,
              ],
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

        <Source id="impact-hover" type="geojson" data={hoverGeometry}>
          <Layer
            id="impact-hover-fill"
            type="fill"
            filter={['==', ['geometry-type'], 'Polygon']}
            paint={{ 'fill-color': colors.label, 'fill-opacity': 0.08 }}
          />
          <Layer
            id="impact-hover-lines"
            type="line"
            paint={{ 'line-color': colors.label, 'line-width': 1.5, 'line-dasharray': [2, 1.5] }}
          />
        </Source>

        <Source id="impacts" type="geojson" data={impactsFc}>
          <Layer
            id="impacts-circle"
            type="circle"
            paint={{
              // Duds (warhead failures) are hollow; detonations are filled.
              'circle-color': ['case', ['get', 'dud'], 'rgba(0,0,0,0)', volleyColor],
              'circle-stroke-color': ['case', ['get', 'dud'], volleyColor, colors.siloStroke],
              'circle-stroke-width': ['case', ['get', 'dud'], 1.5, 0.75],
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 1.5, 10, 2.5, 14, 4.5],
            }}
          />
        </Source>

        {hovered?.kind === 'silo' && (
          <Popup
            longitude={hovered.lon}
            latitude={hovered.lat}
            anchor="bottom"
            offset={12}
            closeButton={false}
            closeOnClick={false}
          >
            <p className="text-sm font-semibold">{hovered.id}</p>
            {siloStates && (
              <p className="text-xs">{SILO_STATE_LABEL[hovered.state] ?? hovered.state}</p>
            )}
            <p className="text-xs text-muted-foreground tabular-nums">
              {hovered.lat.toFixed(5)}°, {hovered.lon.toFixed(5)}°
            </p>
          </Popup>
        )}
        {hoverImpact && (
          <Popup
            longitude={hoverImpact.lon}
            latitude={hoverImpact.lat}
            anchor="bottom"
            offset={10}
            closeButton={false}
            closeOnClick={false}
          >
            <p className="text-sm font-semibold">
              Volley {hoverImpact.volley} · aimed at {hoverImpact.aimId}
            </p>
            <p className="text-xs tabular-nums">
              Miss distance{' '}
              {Math.round(
                distanceM(hoverImpact, { lat: hoverImpact.aimLat, lon: hoverImpact.aimLon }),
              )}{' '}
              m
            </p>
            <p className="text-xs text-muted-foreground">
              {hoverImpact.dud
                ? 'Warhead failure: landed, did not detonate'
                : hoverImpact.killedIds.length
                  ? `Destroyed ${hoverImpact.killedIds.join(', ')}`
                  : 'Detonated, no silo within lethal radius'}
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
      <MapLegend
        showSimStates={siloStates !== null}
        volleys={options.showImpacts ? volleysShown : 0}
      />
      {children}
    </div>
  )
}

/**
 * Atmosphere glow around the globe (MapLibre sky). It fades out as you zoom in, where the
 * globe blends into a flat map anyway; mercator ignores it.
 */
const SKY: SkySpecification = {
  'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
}

/** Map paint colours come from CSS variables so the theme stays in index.css. */
function useThemeColors() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement)
    const v = (name: string) => css.getPropertyValue(name).trim()
    return {
      background: v('--background'),
      silo: v('--map-silo'),
      siloDestroyed: v('--map-silo-destroyed'),
      siloUntargeted: v('--map-silo-untargeted'),
      siloStroke: v('--map-silo-stroke'),
      ring: v('--map-ring'),
      label: v('--map-label'),
      labelHalo: v('--map-label-halo'),
      viz1: v('--viz-1'),
      viz2: v('--viz-2'),
      viz3: v('--viz-3'),
      vizOther: v('--viz-other'),
    }
  }, [])
}
