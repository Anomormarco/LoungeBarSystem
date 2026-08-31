import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [47.9184, 106.9177];

// Kept in sync with server/scripts/seed-restaurants.js - 18 markers scatter
// organically around the city center (Officers' Palace to 10th khoroolol),
// elongated east-west rather than north-south; the remaining 9 sit further
// out toward the city's outskirts in varied directions (not just N/S).
const FALLBACK_MARKERS = [
  ['Skyline Lounge', 48.0366, 106.8158],
  ['Noir Social Club', 47.8489, 107.14],
  ['Velvet Room', 48.0104, 106.9545],
  ['Amber Terrace', 47.8986, 106.8252],
  ['Mellow Garden', 47.9346, 106.9914],
  ['The Brass Bar', 47.7774, 106.8411],
  ['Aurora Lounge', 47.9418, 107.0035],
  ['Nomad Table', 47.9103, 106.8601],
  ['Crown & Smoke', 48.0193, 106.8912],
  ['Saffron Rooftop', 47.9617, 107.0953],
  ['Luna Bistro', 47.9148, 106.9043],
  ['Echo Lounge', 47.9471, 106.8896],
  ['Golden Hour', 47.9256, 106.8024],
  ['Urban Flame', 47.9328, 106.8721],
  ['Opal Room', 47.9283, 106.848],
  ['Mint Social', 47.9211, 107.0129],
  ['Horizon Grill', 47.8941, 106.8131],
  ['Cedar Lounge', 47.8968, 106.9794],
  ['Ivory Table', 47.9445, 106.9673],
  ['Copper House', 47.8637, 106.6935],
  ['Jade Garden', 47.8879, 106.8359],
  ['Monarch Lounge', 47.8129, 106.975],
  ['Naran Terrace', 47.904, 106.9365],
  ['Pearl Bistro', 47.9611, 106.7426],
  ['Aria Lounge', 47.9238, 106.9526],
  ['Tempo Kitchen', 47.8906, 107.0236],
  ['Breeze Rooftop', 47.9085, 106.9204],
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
    const points = markers.map((marker) => [marker.lat, marker.lng]);

    const applyFit = () => {
      map.invalidateSize();
      if (points.length === 0 && center) {
        map.setView(center, 14, { animate: true });
        return;
      }
      // Frame the restaurants only; the user dot should not make the
      // distribution look like a radius around their position.
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
