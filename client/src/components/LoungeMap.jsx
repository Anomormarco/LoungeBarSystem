import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [47.9184, 106.9177];

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
    html: `<span class="lounge-pin ${active ? 'is-active' : ''}"><span></span></span>`,
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
}) {
  const [mapStyle, setMapStyle] = useState('dark');
  const center = useMemo(() => {
    if (location?.lat && location?.lng) return [Number(location.lat), Number(location.lng)];
    return DEFAULT_CENTER;
  }, [location]);

  const userIcon = useMemo(() => createUserIcon(), []);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
        {mapStyle === 'satellite' ? (
          <TileLayer
            attribution="Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : mapStyle === 'light' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        )}
        <RecenterMap center={center} />

        {location?.lat && location?.lng && (
          <Marker position={[Number(location.lat), Number(location.lng)]} icon={userIcon} />
        )}

        {organizations.map((org) => {
          const lat = Number(org.lat ?? org.latitude);
          const lng = Number(org.lng ?? org.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const active = org.id === selectedOrgId;
          return (
            <Marker
              key={org.id}
              position={[lat, lng]}
              icon={createLoungeIcon(active)}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent?.stopPropagation?.();
                  onOrganizationSelect?.(org, { source: 'click' });
                },
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
    </div>
  );
}
