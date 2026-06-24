import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { publicApi } from '../../utils/api';
import {
  AlertCircle,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Table2,
  UtensilsCrossed,
  X,
} from 'lucide-react';

const DEFAULT_LOCATION = {
  lat: 47.9184,
  lng: 106.9177,
  label: 'Улаанбаатар төв',
};

const MAP_CENTER = {
  lat: 47.9135,
  lng: 106.895,
};

const UB_MAP_BOUNDS = {
  minLat: 47.875,
  maxLat: 47.945,
  minLng: 106.84,
  maxLng: 106.985,
};

const STATUS_LABELS = {
  available: 'Сул',
  reserved: 'Захиалгатай',
  occupied: 'Дүүрсэн',
  disabled: 'Идэвхгүй',
  custom: 'Тусгай',
};

function formatDistance(meters) {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
}

function getCoverImage(org) {
  const images = org?.exteriorImages || org?.exterior_images;
  if (Array.isArray(images) && images.length > 0) return images[0];
  return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=80';
}

function getGoogleMapUrl() {
  return `https://maps.google.com/maps?width=100%25&height=720&hl=en&q=${MAP_CENTER.lat},${MAP_CENTER.lng}&t=&z=13&ie=UTF8&iwloc=B&output=embed`;
}

function getMarkerPosition(point, bounds) {
  const lat = Number(point.lat ?? point.latitude);
  const lng = Number(point.lng ?? point.longitude);
  const left = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const top = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    left: `${Math.min(95, Math.max(5, left))}%`,
    top: `${Math.min(90, Math.max(10, top))}%`,
  };
}

function getTableStatusCounts(tables) {
  return tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {});
}

export default function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(9);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableType, setTableType] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const selectedSummary = organizations.find((org) => org.id === selectedOrgId);
  const mapBounds = UB_MAP_BOUNDS;
  const tables = selectedDetail?.tables || [];
  const menuItems = selectedDetail?.menuItems || [];
  const tableStatusCounts = getTableStatusCounts(tables);
  const exteriorImages = selectedDetail?.exteriorImages || selectedSummary?.exteriorImages || [];
  const interiorImages = selectedDetail?.interiorImages || selectedSummary?.interiorImages || [];
  const previewImages = [...exteriorImages.slice(0, 2), ...interiorImages.slice(0, 2)];
  const selectedDescription = selectedDetail?.description || selectedSummary?.description;
  const selectedPhone = selectedDetail?.phone || selectedSummary?.phone;
  const selectedOpeningTime = selectedDetail?.openingTime || selectedSummary?.opening_time;
  const selectedClosingTime = selectedDetail?.closingTime || selectedSummary?.closing_time;

  const requestLocation = () => {
    setLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Таны browser байршил дэмжихгүй байна.');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel('Таны одоогийн байршил');
        setLoadingLocation(false);
      },
      () => {
        setLocationError('Байршлын зөвшөөрөл олгоогүй. УБ төвөөр хайж болно.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const useDefaultLocation = () => {
    setLocation({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
    setLocationLabel(DEFAULT_LOCATION.label);
    setLocationError('');
    setLoadingLocation(false);
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchNearby = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicApi.getNearbyOrganizations(location.lat, location.lng, radius, {
          q: searchQuery,
          tableType,
          availableOnly,
        });
        setOrganizations(res.data || []);
      } catch (err) {
        setError(err.message || 'Lounge жагсаалт ачаалахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [location, radius, searchQuery, tableType, availableOnly]);

  const selectOrganization = async (org) => {
    if (org.id === selectedOrgId && selectedDetail) return;

    setSelectedOrgId(org.id);
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const [orgRes, tablesRes, menuRes] = await Promise.all([
        publicApi.getOrganization(org.id),
        publicApi.getOrganizationTables(org.id),
        publicApi.getOrganizationMenu(org.id),
      ]);
      setSelectedDetail({
        ...orgRes.data,
        tables: tablesRes.data || [],
        menuItems: menuRes.data || [],
      });
    } catch (err) {
      setError(err.message || 'Lounge мэдээлэл ачаалахад алдаа гарлаа.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <UserLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Ойролцоо <span className="text-gradient-yellow">Lounge</span> олох
          </h1>
          <p className="text-lounge-muted text-sm max-w-xl">
            Байршлаа зөвшөөрөөд ойр байгаа lounge-уудыг Google Map дээрээс сонгоно.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-lounge-card border border-lounge-border overflow-hidden">
          <div className="p-4 border-b border-lounge-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-lounge-yellow/10 text-lounge-yellow">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Таны байршил</p>
                  {loadingLocation ? (
                    <p className="text-xs text-lounge-muted flex items-center gap-2 mt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Байршил татаж байна...
                    </p>
                  ) : location ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-lounge-yellow font-semibold">
                        {locationLabel || 'Сонгосон байршил'}
                      </p>
                      <p className="text-xs text-lounge-muted">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 mt-1">{locationError}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-2 text-xs font-bold bg-lounge-yellow text-lounge-black rounded-lg hover:bg-lounge-yellow-dark transition-colors"
                >
                  Байршил шинэчлэх
                </button>
                <button
                  onClick={useDefaultLocation}
                  className="px-4 py-2 text-xs font-bold bg-lounge-black text-lounge-yellow border border-lounge-border rounded-lg hover:border-lounge-yellow/50 transition-colors"
                >
                  УБ төвөөр хайх
                </button>
              </div>
            </div>

            <div
              className="relative mt-4 overflow-hidden rounded-2xl border border-lounge-border bg-white"
              style={{ height: 720, minHeight: 720 }}
            >
              <iframe
                title="Google map"
                src={getGoogleMapUrl(location)}
                className="block h-full w-full border-0 bg-white"
                style={{ height: 720, minHeight: 720, pointerEvents: 'none' }}
                loading="lazy"
                allowFullScreen
              />

              <div className="pointer-events-none absolute inset-0 z-10">
                {location && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={getMarkerPosition(location, mapBounds)}
                    title={locationLabel || 'Таны байршил'}
                  >
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-white shadow-lg" />
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
                    </div>
                  </div>
                )}

                {organizations.map((org) => {
                  const active = org.id === selectedOrgId;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => selectOrganization(org)}
                      onMouseEnter={() => selectOrganization(org)}
                      onPointerEnter={() => selectOrganization(org)}
                      onFocus={() => selectOrganization(org)}
                      className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 border-lounge-black shadow-lg transition-transform duration-200 ease-out ${
                        active
                          ? 'w-8 h-8 bg-orange-400 text-lounge-black scale-125 shadow-orange-400/50 z-20'
                          : 'w-6 h-6 bg-lounge-yellow text-lounge-black hover:scale-125 hover:bg-orange-300 shadow-lounge-yellow/30'
                      } text-[11px] font-black cursor-pointer`}
                      style={getMarkerPosition(org, mapBounds)}
                      title={org.name}
                    >
                      L
                    </button>
                  );
                })}
              </div>

              <div className="absolute left-4 top-4 z-20 px-3 py-2 rounded-xl bg-lounge-black/85 border border-lounge-border">
                <p className="text-xs font-semibold text-lounge-yellow">Google Map</p>
                <p className="text-[11px] text-lounge-muted">{organizations.length} lounge marker</p>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${location?.lat || DEFAULT_LOCATION.lat},${location?.lng || DEFAULT_LOCATION.lng}`}
                target="_blank"
                rel="noreferrer"
                className="absolute right-4 top-4 z-20 px-3 py-2 rounded-xl bg-lounge-black/85 border border-lounge-border text-[11px] font-bold text-lounge-yellow hover:border-lounge-yellow/50"
              >
                Google Maps нээх
              </a>

              {loading && (
                <div className="absolute inset-0 z-30 bg-lounge-black/70 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-lounge-yellow animate-spin" />
                  <p className="text-sm text-lounge-muted">Ойролцоох lounge хайж байна...</p>
                </div>
              )}

              {selectedSummary && (
                <div className="absolute bottom-4 right-4 z-30 w-[min(380px,calc(100%-2rem))] rounded-2xl bg-lounge-card border border-lounge-border shadow-2xl overflow-hidden">
                  <div className="relative h-32">
                    <img
                      src={getCoverImage(selectedDetail || selectedSummary)}
                      alt={selectedSummary.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-lounge-black/90 to-transparent" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrgId(null);
                        setSelectedDetail(null);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-lounge-black/80 border border-lounge-border text-lounge-muted hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute left-4 right-4 bottom-3">
                      <h2 className="font-extrabold">{selectedSummary.name}</h2>
                      <p className="text-xs text-lounge-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-lounge-yellow" />
                        {selectedSummary.address}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 max-h-[420px] overflow-auto">
                    {detailLoading && (
                      <div className="flex items-center gap-2 text-xs text-lounge-yellow">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Дэлгэрэнгүй мэдээлэл ачаалж байна...
                      </div>
                    )}

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-lounge-black border border-lounge-border">
                            <p className="font-extrabold text-lounge-yellow">
                              {selectedSummary.availableTableCount ?? tableStatusCounts.available ?? 0}
                            </p>
                            <p className="text-[10px] text-lounge-muted">сул</p>
                          </div>
                          <div className="p-2 rounded-xl bg-lounge-black border border-lounge-border">
                            <p className="font-extrabold text-lounge-yellow">
                              {selectedSummary.vipTableCount ?? tables.filter((table) => table.type === 'vip').length}
                            </p>
                            <p className="text-[10px] text-lounge-muted">VIP</p>
                          </div>
                          <div className="p-2 rounded-xl bg-lounge-black border border-lounge-border">
                            <p className="font-extrabold text-lounge-yellow">
                              {formatDistance(Number(selectedSummary.distanceMeters))}
                            </p>
                            <p className="text-[10px] text-lounge-muted">зай</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          {selectedDescription && (
                            <p className="text-lounge-muted leading-relaxed line-clamp-3">
                              {selectedDescription}
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="px-3 py-2 rounded-xl bg-lounge-black border border-lounge-border">
                              <p className="text-[10px] text-lounge-muted uppercase">Утас</p>
                              <p className="font-bold text-white mt-0.5">{selectedPhone || 'Бүртгэлгүй'}</p>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-lounge-black border border-lounge-border">
                              <p className="text-[10px] text-lounge-muted uppercase">Цаг</p>
                              <p className="font-bold text-white mt-0.5">
                                {selectedOpeningTime && selectedClosingTime
                                  ? `${selectedOpeningTime} - ${selectedClosingTime}`
                                  : 'Тодорхойгүй'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-lounge-yellow flex items-center gap-2 mb-2">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Interior / Exterior
                          </h3>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(previewImages.length > 0 ? previewImages : [getCoverImage(selectedDetail || selectedSummary)]).slice(0, 4).map((image, index) => (
                              <img
                                key={image + index}
                                src={image}
                                alt=""
                                className="h-14 w-full object-cover rounded-lg border border-lounge-border"
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-lounge-yellow flex items-center gap-2 mb-2">
                            <Table2 className="w-3.5 h-3.5" />
                            Төлөв
                          </h3>
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(STATUS_LABELS).map(([status, label]) => (
                              <div key={status} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-lounge-black border border-lounge-border text-[11px]">
                                <span className="text-lounge-muted">{label}</span>
                                <span className="font-bold text-lounge-yellow">{tableStatusCounts[status] || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-lounge-yellow flex items-center gap-2 mb-2">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            Menu
                          </h3>
                          <div className="space-y-1.5">
                            {menuItems.length > 0 ? (
                              menuItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-lounge-black border border-lounge-border">
                                  <p className="text-xs font-semibold truncate">{item.name}</p>
                                  <span className="text-[11px] font-bold text-lounge-yellow shrink-0">
                                    {Number(item.price).toLocaleString()} ₮
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="px-2 py-2 rounded-lg bg-lounge-black border border-lounge-border text-[11px] text-lounge-muted">
                                {detailLoading ? 'Menu ачаалж байна...' : 'Menu бүртгэлгүй байна'}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/lounge/${selectedSummary.id}`)}
                          className="w-full py-2.5 rounded-xl bg-lounge-yellow text-lounge-black text-sm font-extrabold hover:bg-lounge-yellow-dark transition-colors flex items-center justify-center gap-2"
                        >
                          Дэлгэрэнгүй захиалах
                          <ChevronRight className="w-4 h-4" />
                        </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-lounge-yellow">
                <SlidersHorizontal className="w-4 h-4" />
                Шүүлтүүр
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lounge-muted" />
                  <input
                    type="text"
                    placeholder="Нэр, хаягаар хайх..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-yellow"
                  />
                </div>

                <div>
                  <label className="text-xs text-lounge-muted mb-1 block">
                    Радиус: {radius} км
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-lounge-yellow"
                  />
                </div>

                <div>
                  <label className="text-xs text-lounge-muted mb-1 block">
                    Ширээний төрөл
                  </label>
                  <select
                    value={tableType}
                    onChange={(e) => setTableType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-yellow"
                  >
                    <option value="all">Бүгд</option>
                    <option value="normal">Normal</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 px-3 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="w-4 h-4 accent-lounge-yellow"
                  />
                  <span>Зөвхөн сул ширээтэй</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
