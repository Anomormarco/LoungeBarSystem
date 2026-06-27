import React, { useEffect, useRef, useState } from 'react';
import UserLayout from '../../components/UserLayout';
import ReservationModal from '../../components/ReservationModal';
import LoungeMap from '../../components/LoungeMap';
import { publicApi } from '../../utils/api';
import {
  AlertCircle,
  ChevronRight,
  Crown,
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

const STATUS_CONFIG = {
  available: { label: 'Сул', color: 'bg-lounge-success/20 text-lounge-success border-lounge-success/30' },
  reserved: { label: 'Захиалгатай', color: 'bg-lounge-warning/20 text-lounge-warning border-lounge-warning/30' },
  occupied: { label: 'Дүүрсэн', color: 'bg-lounge-danger/20 text-lounge-danger border-lounge-danger/30' },
  disabled: { label: 'Идэвхгүй', color: 'bg-lounge-primary/15 text-lounge-primary border-lounge-primary/30' },
  custom: { label: 'Тусгай', color: 'bg-lounge-accent/20 text-lounge-accent border-lounge-accent/30' },
};

function getStatusLabel(table) {
  if (table.status === 'custom' && table.customStatusLabel) {
    return table.customStatusLabel;
  }
  return STATUS_CONFIG[table.status]?.label || table.status;
}

function getStatusColor(table) {
  return STATUS_CONFIG[table.status]?.color || STATUS_CONFIG.custom.color;
}

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
  const detailRequestRef = useRef(0);
  const tableListRef = useRef(null);
  const [location, setLocation] = useState({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION.label);
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
  const [detailOverlayOpen, setDetailOverlayOpen] = useState(false);
  const [stickyPreviewId, setStickyPreviewId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableViewFilter, setTableViewFilter] = useState('all');

  const selectedSummary = organizations.find((org) => org.id === selectedOrgId);
  const mapBounds = UB_MAP_BOUNDS;
  const tables = selectedDetail?.tables || [];
  const menuItems = selectedDetail?.menuItems || [];
  const tableStatusCounts = getTableStatusCounts(tables);
  const filteredTables = tables.filter((table) => {
    if (tableViewFilter === 'available') return table.status === 'available';
    if (tableViewFilter === 'vip') return table.type === 'vip';
    return true;
  });
  const exteriorImages = selectedDetail?.exteriorImages || selectedSummary?.exteriorImages || [];
  const interiorImages = selectedDetail?.interiorImages || selectedSummary?.interiorImages || [];
  const previewImages = [...exteriorImages.slice(0, 2), ...interiorImages.slice(0, 2)];
  const selectedDescription = selectedDetail?.description || selectedSummary?.description;
  const selectedPhone = selectedDetail?.phone || selectedSummary?.phone;
  const selectedOpeningTime = selectedDetail?.openingTime || selectedSummary?.opening_time;
  const selectedClosingTime = selectedDetail?.closingTime || selectedSummary?.closing_time;

  const openLoungeDetail = () => {
    setTableViewFilter('all');
    setDetailOverlayOpen(true);
  };

  const closeLoungeDetail = () => {
    setDetailOverlayOpen(false);
    setSelectedTable(null);
    setTableViewFilter('all');
  };

  const hideOrganizationPreview = () => {
    if (detailOverlayOpen) return;
    if (stickyPreviewId) return;
    clearOrganizationPreview();
  };

  const showTableGroup = (filter) => {
    setTableViewFilter(filter);
    tableListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const refreshSelectedTables = async () => {
    if (!selectedSummary) return;

    const tablesRes = await publicApi.getOrganizationTables(selectedSummary.id);
    setSelectedDetail((prev) => ({
      ...(prev || selectedSummary),
      tables: tablesRes.data || [],
      menuItems,
    }));
  };

  const useDefaultLocation = (message = '') => {
    setLocation({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
    setLocationLabel(DEFAULT_LOCATION.label);
    setLocationError(typeof message === 'string' ? message : '');
    setLoadingLocation(false);
  };

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

  const clearOrganizationPreview = () => {
    detailRequestRef.current += 1;
    closeLoungeDetail();
    setStickyPreviewId(null);
    setSelectedOrgId(null);
    setSelectedDetail(null);
    setDetailLoading(false);
  };

  const previewOrganization = async (org, options = {}) => {
    if (stickyPreviewId && options.source === 'hover' && org.id !== stickyPreviewId) return;

    if (options.source === 'click') {
      setStickyPreviewId(org.id);
    }
    if (org.id === selectedOrgId && selectedDetail) return;

    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setSelectedOrgId(org.id);
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const [orgRes, tablesRes, menuRes] = await Promise.all([
        publicApi.getOrganization(org.id),
        publicApi.getOrganizationTables(org.id),
        publicApi.getOrganizationMenu(org.id),
      ]);
      if (detailRequestRef.current === requestId) {
        setSelectedDetail({
          ...orgRes.data,
          tables: tablesRes.data || [],
          menuItems: menuRes.data || [],
        });
      }
    } catch (err) {
      setError(err.message || 'Lounge мэдээлэл ачаалахад алдаа гарлаа.');
    } finally {
      if (detailRequestRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  };

  return (
    <UserLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Ойролцоо <span className="text-gradient-neon font-black drop-shadow-[0_0_15px_rgba(255,168,0,0.3)]">Lounge</span> олох
          </h1>
          <p className="text-lounge-muted text-sm max-w-xl">
            Байршлаа зөвшөөрөөд ойр байгаа lounge-уудыг Google Map дээрээс сонгоно.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-lounge-danger/10 border border-lounge-danger/20 text-lounge-danger text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-lounge-card border border-lounge-border overflow-hidden">
          <div className="p-4 border-b border-lounge-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-lounge-accent/10 text-lounge-accent shadow-[0_0_10px_rgba(255,168,0,0.15)]">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Таны байршил</p>
                  {loadingLocation ? (
                    <p className="text-xs text-lounge-muted flex items-center gap-2 mt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Байршил татаж байна...
                    </p>
                  ) : location ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-lounge-accent font-bold">
                        {locationLabel || 'Сонгосон байршил'}
                      </p>
                      <p className="text-xs text-lounge-muted">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-lounge-danger mt-1">{locationError}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={requestLocation}
                  className="px-4 py-2 text-xs font-bold bg-lounge-primary text-white rounded-lg hover:bg-lounge-accent hover:shadow-[0_0_12px_rgba(255,168,0,0.35)] transition-all duration-300"
                >
                  Байршил шинэчлэх
                </button>
                <button
                  onClick={useDefaultLocation}
                  className="px-4 py-2 text-xs font-bold bg-lounge-black text-lounge-accent border border-lounge-border/80 rounded-lg hover:border-lounge-accent hover:shadow-[0_0_10px_rgba(255,168,0,0.25)] hover:text-white transition-all duration-300"
                >
                  УБ төвөөр хайх
                </button>
              </div>

            </div>

            <div
              className="relative mt-4 overflow-hidden rounded-2xl border border-lounge-border/60 bg-lounge-black shadow-[0_0_25px_rgba(0,0,0,0.5)]"
              style={{ height: 600, minHeight: 600 }}
              onClick={clearOrganizationPreview}
            >
              <LoungeMap
                location={location}
                locationLabel={locationLabel}
                organizations={organizations}
                selectedOrgId={selectedOrgId}
                onOrganizationSelect={previewOrganization}
                onOrganizationClear={hideOrganizationPreview}
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${location?.lat || DEFAULT_LOCATION.lat}&mlon=${location?.lng || DEFAULT_LOCATION.lng}#map=15/${location?.lat || DEFAULT_LOCATION.lat}/${location?.lng || DEFAULT_LOCATION.lng}`}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-4 left-4 z-20 rounded-xl bg-lounge-card/90 border border-lounge-border px-3 py-2 text-xs font-bold text-white shadow-xl shadow-black/30 hover:bg-lounge-primary/20 hover:text-lounge-accent transition-all"
              >
                {organizations.length} lounges</a>

              {loading && (
                <div className="absolute inset-0 z-30 bg-lounge-black/85 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-lounge-accent animate-spin" />
                  <p className="text-sm text-lounge-muted">Ойролцоох lounge хайж байна...</p>
                </div>
              )}
              {selectedSummary && (
                <div
                  className="absolute bottom-4 right-4 z-40 w-[min(380px,calc(100%-2rem))] rounded-2xl bg-lounge-card/95 border border-lounge-primary/30 shadow-[0_0_25px_rgba(255,168,0,0.24)] backdrop-blur-md overflow-hidden"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="relative h-32">
                    <img
                      src={getCoverImage(selectedDetail || selectedSummary)}
                      alt={selectedSummary.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-lounge-black/95 to-transparent" />
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
                      <h2 className="font-extrabold text-white">{selectedSummary.name}</h2>
                      <p className="text-xs text-lounge-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-lounge-accent" />
                        {selectedSummary.address}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 max-h-[420px] overflow-auto">
                    {detailLoading && (
                      <div className="flex items-center gap-2 text-xs text-lounge-accent">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Дэлгэрэнгүй мэдээлэл ачаалж байна...
                      </div>
                    )}

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-xl bg-lounge-black border border-lounge-border">
                            <p className="font-extrabold text-lounge-success">
                              {selectedSummary.availableTableCount ?? tableStatusCounts.available ?? 0}
                            </p>
                            <p className="text-[10px] text-lounge-muted">сул</p>
                          </div>
                          <div className="p-2 rounded-xl bg-lounge-black border border-lounge-border">
                            <p className="font-extrabold text-lounge-primary">
                              {selectedSummary.vipTableCount ?? tables.filter((table) => table.type === 'vip').length}
                            </p>
                            <p className="text-[10px] text-lounge-muted">VIP</p>
                          </div>
                          <div className="p-2 rounded-xl bg-lounge-black border border-lounge-border">
                            <p className="font-extrabold text-lounge-accent">
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
                          <h3 className="text-xs font-bold text-lounge-accent flex items-center gap-2 mb-2">
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
                          <h3 className="text-xs font-bold text-lounge-accent flex items-center gap-2 mb-2">
                            <Table2 className="w-3.5 h-3.5" />
                            Төлөв
                          </h3>
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(STATUS_LABELS).map(([status, label]) => (
                              <div key={status} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-lounge-black border border-lounge-border text-[11px]">
                                <span className="text-lounge-muted">{label}</span>
                                <span className="font-bold text-lounge-accent">{tableStatusCounts[status] || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-lounge-accent flex items-center gap-2 mb-2">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            Menu
                          </h3>
                          <div className="space-y-1.5">
                            {menuItems.length > 0 ? (
                              menuItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-lounge-black border border-lounge-border">
                                  <p className="text-xs font-semibold truncate">{item.name}</p>
                                  <span className="text-[11px] font-bold text-lounge-accent shrink-0">
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
                          onClick={openLoungeDetail}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-lounge-primary to-lounge-accent text-white text-sm font-extrabold hover:shadow-[0_0_15px_rgba(255,168,0,0.35)] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          Дэлгэрэнгүй захиалах
                          <ChevronRight className="w-4 h-4" />
                        </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-lounge-accent">
                <SlidersHorizontal className="w-4 h-4" />
                Шүүлтүүр
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="flex flex-col">
                  <label className="text-xs text-lounge-muted mb-1 block h-4">
                    Нэр, хаяг
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lounge-muted" />
                    <input
                      type="text"
                      placeholder="Нэр, хаягаар хайх..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 h-[42px] bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_10px_rgba(255,168,0,0.15)] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Radius */}
                <div className="flex flex-col">
                  <label className="text-xs text-lounge-muted mb-1 block h-4">
                    Радиус: {radius} км
                  </label>
                  <div className="flex items-center px-3 bg-lounge-black border border-lounge-border rounded-xl h-[42px]">
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full accent-lounge-primary bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                {/* Table Type */}
                <div className="flex flex-col">
                  <label className="text-xs text-lounge-muted mb-1 block h-4">
                    Ширээний төрөл
                  </label>
                  <select
                    value={tableType}
                    onChange={(e) => setTableType(e.target.value)}
                    className="w-full px-3 h-[42px] bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-primary cursor-pointer"
                  >
                    <option value="all">Бүгд</option>
                    <option value="normal">Normal</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                {/* Status Checkbox */}
                <div className="flex flex-col">
                  <label className="text-xs text-lounge-muted mb-1 block h-4">
                    Төлөв
                  </label>
                  <label className="flex items-center gap-3 px-3 h-[42px] bg-lounge-black border border-lounge-border rounded-xl text-sm cursor-pointer hover:border-lounge-accent/50 transition-all duration-300 select-none">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="w-4 h-4 accent-lounge-accent cursor-pointer"
                    />
                    <span>Зөвхөн сул ширээтэй</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {detailOverlayOpen && selectedSummary && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm px-4 py-6 sm:py-10"
          onClick={closeLoungeDetail}
        >
          <div
            className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-lounge-primary/30 bg-lounge-card shadow-[0_0_30px_rgba(255,168,0,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-56 sm:h-72">
              <img
                src={getCoverImage(selectedDetail || selectedSummary)}
                alt={selectedSummary.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lounge-black via-lounge-black/60 to-transparent" />
              <button
                type="button"
                onClick={closeLoungeDetail}
                className="absolute right-4 top-4 rounded-xl border border-lounge-border bg-lounge-black/85 p-2 text-lounge-muted transition-colors hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 left-5 right-16">
                <h2 className="text-2xl font-extrabold sm:text-3xl text-white">{selectedSummary.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-lounge-muted">
                  <MapPin className="h-4 w-4 shrink-0 text-lounge-accent" />
                  <span className="line-clamp-2">{selectedSummary.address}</span>
                </p>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {detailLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-lounge-primary/20 bg-lounge-black px-4 py-3 text-sm text-lounge-accent">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Дэлгэрэнгүй мэдээлэл ачаалж байна...
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => showTableGroup('available')}
                  className={`rounded-xl border p-4 text-left transition-all hover:border-lounge-accent hover:bg-lounge-card ${
                    tableViewFilter === 'available'
                      ? 'border-lounge-accent bg-lounge-accent/10 shadow-lg shadow-lounge-accent/10'
                      : 'border-lounge-border bg-lounge-black'
                  }`}
                >
                  <p className="text-xs text-lounge-muted">Сул ширээ</p>
                  <p className="mt-1 text-2xl font-extrabold text-lounge-success">
                    {selectedSummary.availableTableCount ?? tableStatusCounts.available ?? 0}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => showTableGroup('vip')}
                  className={`rounded-xl border p-4 text-left transition-all hover:border-lounge-primary hover:bg-lounge-card ${
                    tableViewFilter === 'vip'
                      ? 'border-lounge-primary bg-lounge-primary/10 shadow-lg shadow-lounge-primary/10'
                      : 'border-lounge-border bg-lounge-black'
                  }`}
                >
                  <p className="text-xs text-lounge-muted">VIP</p>
                  <p className="mt-1 text-2xl font-extrabold text-lounge-primary">
                    {selectedSummary.vipTableCount ?? tables.filter((table) => table.type === 'vip').length}
                  </p>
                </button>
                <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                  <p className="text-xs text-lounge-muted">Зай</p>
                  <p className="mt-1 text-2xl font-extrabold text-lounge-accent">
                    {formatDistance(Number(selectedSummary.distanceMeters)) || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                  <p className="text-xs text-lounge-muted">Цаг</p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {selectedOpeningTime && selectedClosingTime
                      ? `${selectedOpeningTime} - ${selectedClosingTime}`
                      : 'Тодорхойгүй'}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-2 text-sm font-extrabold text-lounge-accent">Мэдээлэл</h3>
                    <p className="text-sm leading-relaxed text-lounge-muted">
                      {selectedDescription || 'Тайлбар бүртгэгдээгүй байна.'}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-lounge-border bg-lounge-card px-3 py-2">
                        <p className="text-[11px] uppercase text-lounge-muted">Утас</p>
                        <p className="mt-1 text-sm font-bold text-white">{selectedPhone || 'Бүртгэлгүй'}</p>
                      </div>
                      <div className="rounded-lg border border-lounge-border bg-lounge-card px-3 py-2">
                        <p className="text-[11px] uppercase text-lounge-muted">Байршил</p>
                        <p className="mt-1 line-clamp-2 text-sm font-bold text-white">{selectedSummary.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-lounge-accent">
                      <ImageIcon className="h-4 w-4" />
                      Interior / Exterior
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(previewImages.length > 0 ? previewImages : [getCoverImage(selectedDetail || selectedSummary)]).slice(0, 4).map((image, index) => (
                        <img
                          key={image + index}
                          src={image}
                          alt=""
                          className="h-28 w-full rounded-lg border border-lounge-border object-cover"
                        />
                      ))}
                    </div>
                  </div>

                  <div ref={tableListRef} className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-lounge-accent">
                      <Table2 className="h-4 w-4" />
                      Ширээнүүд
                    </h3>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-lounge-muted">
                        {tableViewFilter === 'available'
                          ? 'Сул ширээнүүд'
                          : tableViewFilter === 'vip'
                          ? 'VIP ширээнүүд'
                          : 'Сул ширээн дээр дарж захиалга өгнө.'}
                      </p>
                      {tableViewFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setTableViewFilter('all')}
                          className="shrink-0 rounded-lg border border-lounge-border px-2 py-1 text-[11px] font-bold text-lounge-accent hover:bg-lounge-accent/15"
                        >
                          Бүгд
                        </button>
                      )}
                    </div>
                    <div className="grid max-h-[28rem] grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3">
                      {filteredTables.map((table) => {
                        const isAvailable = table.status === 'available';
                        return (
                          <button
                            key={table.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => isAvailable && setSelectedTable(table)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              isAvailable
                                ? 'border-lounge-border bg-lounge-card hover:border-lounge-accent hover:shadow-[0_0_12px_rgba(255,168,0,0.22)]'
                                : 'cursor-not-allowed border-lounge-border/50 bg-lounge-card/40 opacity-60'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-base font-extrabold">#{table.tableNumber}</span>
                              {table.type === 'vip' && <Crown className="h-4 w-4 text-lounge-primary shadow-[0_0_8px_rgba(255,168,0,0.3)]" />}
                            </div>
                            <p className="mb-2 text-xs text-lounge-muted">{table.capacity} хүн</p>
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusColor(table)}`}>
                              {getStatusLabel(table)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {filteredTables.length === 0 && (
                      <div className="rounded-lg border border-lounge-border bg-lounge-card px-3 py-3 text-sm text-lounge-muted">
                        {detailLoading ? 'Ширээнүүд ачаалж байна...' : 'Тохирох ширээ алга.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-lounge-accent">
                      <Table2 className="h-4 w-4" />
                      Ширээний төлөв
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(STATUS_LABELS).map(([status, label]) => (
                        <div key={status} className="flex items-center justify-between rounded-lg border border-lounge-border bg-lounge-card px-3 py-2 text-sm">
                          <span className="text-lounge-muted">{label}</span>
                          <span className="font-extrabold text-lounge-accent">{tableStatusCounts[status] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-lounge-yellow">
                      <Table2 className="h-4 w-4" />
                      Захиалга өгөх ширээ
                    </h3>
                    <p className="mb-3 text-xs text-lounge-muted">
                      Ногоон буюу сул ширээн дээр дараад захиалгаа өгнө.
                    </p>
                    <div className="grid max-h-80 grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3">
                      {tables.map((table) => {
                        const isAvailable = table.status === 'available';
                        return (
                          <button
                            key={table.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => isAvailable && setSelectedTable(table)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              isAvailable
                                ? 'border-lounge-border bg-lounge-card hover:border-lounge-accent hover:shadow-[0_0_12px_rgba(255,168,0,0.22)]'
                                : 'cursor-not-allowed border-lounge-border/50 bg-lounge-card/40 opacity-60'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-base font-extrabold">#{table.tableNumber}</span>
                              {table.type === 'vip' && <Crown className="h-4 w-4 text-lounge-primary" />}
                            </div>
                            <p className="mb-2 text-xs text-lounge-muted">{table.capacity} хүн</p>
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusColor(table)}`}>
                              {getStatusLabel(table)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {tables.length === 0 && (
                      <div className="rounded-lg border border-lounge-border bg-lounge-card px-3 py-3 text-sm text-lounge-muted">
                        {detailLoading ? 'Ширээ ачаалж байна...' : 'Ширээ бүртгэлгүй байна.'}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-lounge-accent">
                      <UtensilsCrossed className="h-4 w-4" />
                      Menu
                    </h3>
                    <div className="max-h-[34rem] space-y-2 overflow-auto pr-1">
                      {menuItems.length > 0 ? (
                        menuItems.slice(0, 12).map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-lounge-border bg-lounge-card px-3 py-3">
                            <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                            <span className="shrink-0 text-sm font-extrabold text-lounge-accent">
                              {Number(item.price).toLocaleString()} ₮
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-lounge-border bg-lounge-card px-3 py-3 text-sm text-lounge-muted">
                          {detailLoading ? 'Menu ачаалж байна...' : 'Menu бүртгэлгүй байна'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTable && selectedSummary && (
        <ReservationModal
          organization={selectedDetail || selectedSummary}
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onSuccess={() => {
            refreshSelectedTables();
          }}
        />
      )}
    </UserLayout>
  );
}
