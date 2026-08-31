import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [47.9184, 106.9177];

// Kept in sync with server/scripts/seed-restaurants.js - spread across
// recognizable Ulaanbaatar neighborhoods instead of a geometric ring.
const FALLBACK_MARKERS = [
  ['Skyline Lounge', 47.9149, 106.9158],
  ['Noir Social Club', 47.9198, 106.9087],
  ['Velvet Room', 47.9124, 106.9259],
  ['Amber Terrace', 47.9229, 106.9371],
  ['Mellow Garden', 47.9048, 106.9296],
  ['The Brass Bar', 47.9307, 106.9142],
  ['Aurora Lounge', 47.9182, 106.8876],
  ['Nomad Table', 47.9089, 106.8748],
  ['Crown & Smoke', 47.8954, 106.9025],
  ['Saffron Rooftop', 47.8843, 106.9156],
  ['Luna Bistro', 47.889, 106.9445],
  ['Echo Lounge', 47.894, 106.879],
  ['Golden Hour', 47.8795, 106.829],
  ['Urban Flame', 47.858, 106.766],
  ['Opal Room', 47.852, 106.689],
  ['Mint Social', 47.9135, 106.805],
  ['Horizon Grill', 47.955, 106.787],
  ['Cedar Lounge', 47.9665, 106.93],
  ['Ivory Table', 47.9939, 106.9674],
  ['Copper House', 48.013, 106.925],
  ['Jade Garden', 47.9255, 106.947],
  ['Monarch Lounge', 47.9178, 107.018],
  ['Naran Terrace', 47.9008, 107.06],
  ['Pearl Bistro', 47.8905, 107.115],
  ['Aria Lounge', 47.872, 107.18],
  ['Tempo Kitchen', 47.7712, 107.2512],
  ['Breeze Rooftop', 47.838, 106.985],
].map(([name, lat, lng], index) => ({
  id: `map-fallback-${index + 1}`,
  name,
  lat,
  lng,
  isMapFallback: true,
}));

function FitMapView({ center, markers }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...(center ? [center] : []),
      ...markers.map((marker) => [marker.lat, marker.lng]),
    ];

    const applyFit = () => {
      map.invalidateSize();
      if (points.length === 0 && center) {
        map.setView(center, 14, { animate: true });
        return;
      }
      // Frame the user's location together with every marker so nothing
      // sits outside the viewport, however far apart they are.
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15, animate: true });
    };

    applyFit();
    const timer = window.setTimeout(applyFit, 250);
    return () => window.clearTimeout(timer);
  }, [center, markers, map]);

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
  const visibleOrganizations = useMemo(() => {
    const source = organizations.length > 0 ? organizations : FALLBACK_MARKERS;

    return source
      .map((org) => {
        const lat = Number(org.lat ?? org.latitude);
        const lng = Number(org.lng ?? org.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...org, lat, lng };
      })
      .filter(Boolean);
  }, [organizations]);

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
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              className="lounge-dark-map-tiles"
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              className="lounge-dark-map-tiles"
            />
          </>
        )}
        <FitMapView center={center} markers={visibleOrganizations} />

        {location?.lat && location?.lng && (
          <Marker position={[Number(location.lat), Number(location.lng)]} icon={userIcon} />
        )}

        {visibleOrganizations.map((org) => {
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
              position={[org.lat, org.lng]}
              icon={createLoungeIcon(active)}
              pane="markerPane"
              zIndexOffset={active ? 1200 : 900}
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
        .lounge-dark-map-tiles {
          filter: contrast(2.4) brightness(1.75);
        }
        .leaflet-control-attribution,
        .leaflet-control-zoom {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
