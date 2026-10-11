import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { BHOPAL_CENTER } from '../../lib/map/bounds'
import type { RiskLabel } from '../../types'

export interface MapPin {
  site: string
  lat: number
  lng: number
  rank: number
  label: RiskLabel
  /** Plain-text line shown in the popup. */
  summary: string
}

const PIN_CLASS: Record<RiskLabel, string> = {
  'High priority': 'pin-high', 'Moderate priority': 'pin-moderate', 'Lower observed concern': 'pin-lower', 'Insufficient data': 'pin-insufficient',
}

interface Props {
  pins: MapPin[]
  openLabel: string
  onOpen: (site: string) => void
  /** When set, the next map click is reported through onPlace instead of doing nothing. */
  placing: boolean
  pending: { lat: number; lng: number } | null
  onPlace: (lat: number, lng: number) => void
}

/** OpenStreetMap via Leaflet: no API key. Tiles come from tile.openstreetmap.org and need the attribution below. */
export function LeafletMap({ pins, openLabel, onOpen, placing, pending, onPlace }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const pendingMarker = useRef<L.Marker | null>(null)
  const placingRef = useRef(placing)
  const onPlaceRef = useRef(onPlace)
  const fitted = useRef(false)

  useEffect(() => {
    placingRef.current = placing
    onPlaceRef.current = onPlace
    host.current?.classList.toggle('cursor-crosshair', placing)
  }, [placing, onPlace])

  useEffect(() => {
    if (!host.current || map.current) return
    const m = L.map(host.current, { center: [BHOPAL_CENTER.lat, BHOPAL_CENTER.lng], zoom: 12, scrollWheelZoom: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => {
      if (placingRef.current) onPlaceRef.current(e.latlng.lat, e.latlng.lng)
    })
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const m = map.current
    const group = layer.current
    if (!m || !group) return
    group.clearLayers()
    for (const p of pins) {
      const icon = L.divIcon({ className: '', html: `<div class="ghat-pin ${PIN_CLASS[p.label]}">${p.rank}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] })
      const marker = L.marker([p.lat, p.lng], { icon, title: `${p.site} (rank ${p.rank}, ${p.label})`, keyboard: true })
      const box = document.createElement('div')
      const name = document.createElement('strong')
      name.textContent = p.site
      const line = document.createElement('p')
      line.textContent = p.summary
      line.style.margin = '4px 0 8px'
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = openLabel
      button.style.cssText = 'background:#000;color:#fff;border:0;border-radius:999px;padding:8px 14px;font-weight:600;cursor:pointer'
      button.addEventListener('click', () => onOpen(p.site))
      box.append(name, line, button)
      marker.bindPopup(box)
      marker.addTo(group)
    }
    if (!fitted.current && pins.length > 0) {
      m.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 })
      fitted.current = true
    }
  }, [pins, openLabel, onOpen])

  useEffect(() => {
    const m = map.current
    if (!m) return
    pendingMarker.current?.remove()
    pendingMarker.current = null
    if (pending) {
      pendingMarker.current = L.marker([pending.lat, pending.lng], {
        icon: L.divIcon({ className: '', html: '<div class="ghat-pin pin-pending">?</div>', iconSize: [34, 34], iconAnchor: [17, 17] }),
      }).addTo(m)
    }
  }, [pending])

  return <div ref={host} className="h-[420px] w-full overflow-hidden rounded-lg border border-divider" role="application" aria-label="Map of Bhopal ghats" />
}
