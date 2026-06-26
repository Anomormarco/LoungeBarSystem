import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_CENTER = [47.9184, 106.9177];

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, Math.max(map.getZoom(), 14), { animate: true });
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
  onOrganizationClear,
}) {
  const [mapStyle, setMapStyle] = useState('map');
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
            attribution='Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        )}
        <RecenterMap center={center} />

        {location?.lat && location?.lng && (
          <Marker position={[Number(location.lat), Number(location.lng)]} icon={userIcon}>
            <Tooltip direction="top" offset={[0, -8]}>
              {locationLabel || 'Таны байршил'}
            </Tooltip>
          </Marker>
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
                  onOrganizationSelect?.(org);
                },
                mouseover: () => onOrganizationSelect?.(org),
                mouseout: () => onOrganizationClear?.(),
              }}
            >
              <Popup>
                <div className="min-w-44">
                  <strong>{org.name}</strong>
                  {org.address && <p className="mt-1 text-xs">{org.address}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 right-4 z-[500] flex overflow-hidden rounded-xl bg-white shadow-xl shadow-black/20">
        {[
          ['map', 'Газрын зураг'],
          ['satellite', 'Хиймэл дагуул'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMapStyle(value);
            }}
            className={`px-3 py-2 text-xs font-extrabold transition-colors ${
              mapStyle === value
                ? 'bg-lounge-yellow text-lounge-black'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
