import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [47.9184, 106.9177];

const FALLBACK_MARKERS = [
  ['Skyline Lounge', 47.9184, 106.9177],
  ['Noir Social Club', 47.9168, 106.9055],
  ['Velvet Room', 47.9212, 106.8948],
  ['Amber Terrace', 47.9264, 106.9068],
  ['Mellow Garden', 47.9128, 106.8978],
  ['The Brass Bar', 47.9238, 106.8846],
  ['Aurora Lounge', 47.9138, 106.8862],
  ['Nomad Table', 47.9064, 106.8768],
  ['Crown & Smoke', 47.9298, 106.9412],
  ['Saffron Rooftop', 47.8952, 106.9157],
  ['Luna Bistro', 47.9146, 106.8824],
  ['Echo Lounge', 47.9226, 106.9544],
  ['Golden Hour', 47.9098, 106.8914],
  ['Urban Flame', 47.9114, 106.9632],
  ['Opal Room', 47.9066, 106.8658],
  ['Mint Social', 47.9189, 106.8754],
  ['Horizon Grill', 47.9356, 106.9198],
  ['Cedar Lounge', 47.9048, 106.9664],
  ['Ivory Table', 47.9018, 106.8589],
  ['Copper House', 47.9096, 106.9742],
  ['Jade Garden', 47.9342, 106.9048],
  ['Monarch Lounge', 47.9116, 106.8872],
  ['Naran Terrace', 47.9402, 106.9824],
  ['Pearl Bistro', 47.8988, 106.8568],
  ['Aria Lounge', 47.9134, 106.9928],
  ['Tempo Kitchen', 47.8916, 106.8738],
  ['Breeze Rooftop', 47.9424, 106.8584],
].map(([name, lat, lng], index) => ({
  id: `map-fallback-${index + 1}`,
  name,
  lat,
  lng,
  isMapFallback: true,
}));

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.invalidateSize();
    map.setView(center, Math.max(map.getZoom(), 14), { animate: true });
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      map.setView(center, Math.max(map.getZoom(), 14), { animate: true });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [center, map]);

  return null;
}

function createUserIcon() {
  return L.divIcon({
    className: 'lounge-user-location-marker',
    html: '<span class="lounge-user-dot"><span></span></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createLoungeIcon(active) {
  return L.divIcon({
    className: 'lounge-map-marker',
    html: `
      <span
        class="lounge-pin ${active ? 'is-active' : ''}"
        style="
          --pin-color:#ffad05;
          --pin-glow:rgba(255,173,5,0.72);
          background:#ffad05;
          border:3px solid #fff2c4;
          box-shadow:0 0 0 4px rgba(255,173,5,0.20),0 0 22px rgba(255,173,5,0.90);
        "
      >
        <span style="background:#ffffff;box-shadow:0 0 12px rgba(255,255,255,0.95);"></span>
      </span>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    popupAnchor: [0, -36],
    tooltipAnchor: [0, -32],
  });
}

export default function LoungeMap({
  location,
  locationLabel,
  organizations,
  selectedOrgId,
  onOrganizationSelect,
  onOrganizationOpen,
}) {
  const [mapStyle, setMapStyle] = useState('dark');
  const center = useMemo(() => {
    if (location?.lat && location?.lng) return [Number(location.lat), Number(location.lng)];
    return DEFAULT_CENTER;
  }, [location]);

  const userIcon = useMemo(() => createUserIcon(), []);
  const visibleOrganizations = organizations.length > 0 ? organizations : FALLBACK_MARKERS;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        {mapStyle === 'satellite' ? (
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        ) : mapStyle === 'light' ? (
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        ) : (
          <>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" />
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
          </>
        )}
        <RecenterMap center={center} />

        {location?.lat && location?.lng && (
          <Marker position={[Number(location.lat), Number(location.lng)]} icon={userIcon} />
        )}

        {visibleOrganizations.map((org) => {
          const lat = Number(org.lat ?? org.latitude);
          const lng = Number(org.lng ?? org.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const active = org.id === selectedOrgId;
          const handleMarkerTarget = (event) => {
            event.originalEvent?.stopPropagation?.();
            event.originalEvent?.preventDefault?.();
            if (org.isMapFallback) return;
            if (active) {
              onOrganizationOpen?.(org, { source: 'marker' });
              return;
            }
            onOrganizationSelect?.(org, { source: 'click' });
          };

          return (
            <Marker
              key={org.id}
              position={[lat, lng]}
              icon={createLoungeIcon(active)}
              eventHandlers={{
                click: handleMarkerTarget,
                touchend: handleMarkerTarget,
              }}
            >
              <Tooltip direction="top" offset={[0, -34]} opacity={1} className="lounge-name-tooltip">
                {org.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="lounge-map-style-switch absolute bottom-4 left-1/2 right-auto z-20 flex -translate-x-1/2 overflow-hidden rounded-xl bg-lounge-card border border-lounge-border shadow-xl shadow-black/40">
        {[
          ['dark', 'Dark mode'],
          ['light', 'White mode'],
          ['satellite', 'Хиймэл дагуул'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMapStyle(value);
            }}
            className={`lounge-map-style-button px-3 py-2 text-xs font-extrabold transition-colors ${
              mapStyle === value
                ? 'bg-lounge-primary text-white shadow-[0_0_10px_rgba(255,168,0,0.25)]'
                : 'bg-lounge-black/90 text-lounge-muted hover:text-white hover:bg-lounge-card'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <style>{`
        .leaflet-control-attribution,
        .leaflet-control-zoom {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
