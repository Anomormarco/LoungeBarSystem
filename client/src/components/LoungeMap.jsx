import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [47.9184, 106.9177];

// Kept in sync with server/scripts/seed-restaurants.js - spread evenly
// (by bearing) in a 15-20km ring around the city center so no marker
// sits on Sukhbaatar Square itself.
const FALLBACK_MARKERS = [
  ['Skyline Lounge', 48.0576, 106.9177],
  ['Noir Social Club', 48.0708, 106.9848],
  ['Velvet Room', 48.0731, 107.045],
  ['Amber Terrace', 48.0234, 107.0553],
  ['Mellow Garden', 48.0127, 107.1094],
  ['The Brass Bar', 47.9785, 107.1664],
  ['Aurora Lounge', 47.9365, 107.1252],
  ['Nomad Table', 47.9044, 107.1553],
  ['Crown & Smoke', 47.8651, 107.1706],
  ['Saffron Rooftop', 47.8399, 107.092],
  ['Luna Bistro', 47.8024, 107.0829],
  ['Echo Lounge', 47.7699, 107.0521],
  ['Golden Hour', 47.7847, 106.9856],
  ['Urban Flame', 47.7585, 106.9443],
  ['Opal Room', 47.7469, 106.8723],
  ['Mint Social', 47.7875, 106.8368],
  ['Horizon Grill', 47.7861, 106.7799],
  ['Cedar Lounge', 47.8001, 106.7259],
  ['Ivory Table', 47.8556, 106.7273],
  ['Copper House', 47.881, 106.6897],
  ['Jade Garden', 47.9143, 106.6564],
  ['Monarch Lounge', 47.9459, 106.7088],
  ['Naran Terrace', 47.9814, 106.7018],
  ['Pearl Bistro', 48.0312, 106.7168],
  ['Aria Lounge', 48.0318, 106.7873],
  ['Tempo Kitchen', 48.0617, 106.8172],
  ['Breeze Rooftop', 48.0902, 106.8598],
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
