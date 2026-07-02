import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, MapPin } from 'lucide-react';

const UB_CENTER = { lat: 47.9184, lng: 106.9177 };

function createPickerIcon() {
  return L.divIcon({
    className: 'lounge-map-marker',
    html: '<span class="lounge-pin is-active"><span></span></span>',
    iconSize: [34, 42],
    iconAnchor: [17, 38],
  });
}

function MapSync({ position }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.setView(position, Math.max(map.getZoom(), 14), { animate: true });
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      map.setView(position, Math.max(map.getZoom(), 14), { animate: true });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [map, position]);

  return null;
}

function ClickTarget({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  address,
  onChange,
  onAddressChange,
  disabled = false,
}) {
  const lat = Number(latitude) || UB_CENTER.lat;
  const lng = Number(longitude) || UB_CENTER.lng;
  const position = useMemo(() => [lat, lng], [lat, lng]);
  const icon = useMemo(() => createPickerIcon(), []);

  const pickLocation = (nextLat, nextLng) => {
    if (disabled) return;
    onChange?.({
      latitude: nextLat.toFixed(7),
      longitude: nextLng.toFixed(7),
    });
  };

  const useCurrentLocation = () => {
    if (disabled || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      pickLocation(pos.coords.latitude, pos.coords.longitude);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
          <input
            value={address}
            onChange={(event) => onAddressChange?.(event.target.value)}
            disabled={disabled}
            placeholder="Ulaanbaatar, SBD"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500 disabled:opacity-60"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
        <div className="h-72">
          <MapContainer center={position} zoom={14} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapSync position={position} />
            <ClickTarget onPick={pickLocation} />
            <Marker
              position={position}
              icon={icon}
              draggable={!disabled}
              eventHandlers={{
                dragend(event) {
                  const markerPosition = event.target.getLatLng();
                  pickLocation(markerPosition.lat, markerPosition.lng);
                },
              }}
            />
          </MapContainer>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-800 p-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            <LocateFixed className="h-4 w-4" />
            Current location
          </button>
        </div>
      </div>
    </div>
  );
}
