import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { publicApi } from '../../utils/api';
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

function formatDistance(meters) {
  if (meters == null) return '';
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
}

function getCoverImage(org) {
  const images = org.exteriorImages || org.exterior_images;
  if (Array.isArray(images) && images.length > 0) return images[0];
  return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80';
}

export default function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

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
        setLoadingLocation(false);
      },
      () => {
        setLocationError('Байршлын зөвшөөрөл олгоогүй. Дахин оролдоно уу.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
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
        const res = await publicApi.getNearbyOrganizations(location.lat, location.lng, radius);
        setOrganizations(res.data || []);
      } catch (err) {
        setError(err.message || 'Lounge жагсаалт ачаалахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [location, radius]);

  const filteredOrgs = organizations.filter((org) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !org.name?.toLowerCase().includes(q) &&
        !org.address?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <UserLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Ойролцоо <span className="text-gradient-yellow">Lounge</span> олох
          </h1>
          <p className="text-lounge-muted text-sm max-w-xl">
            Login шаардлагагүй. Байршлаа зөвшөөрч, ойролцоо lounge-уудыг харж, ширээ захиална.
          </p>
        </div>

        {/* Location status */}
        <div className="mb-6 p-4 rounded-2xl bg-lounge-card border border-lounge-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-lounge-yellow/10 text-lounge-yellow">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Таны байршил</p>
              {loadingLocation ? (
                <p className="text-xs text-lounge-muted flex items-center gap-2 mt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Татаж байна...
                </p>
              ) : location ? (
                <p className="text-xs text-lounge-muted mt-1">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              ) : (
                <p className="text-xs text-red-400 mt-1">{locationError}</p>
              )}
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 text-xs font-bold bg-lounge-yellow text-lounge-black rounded-lg hover:bg-lounge-yellow-dark transition-colors shrink-0"
          >
            Байршил шинэчлэх
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 p-4 rounded-2xl bg-lounge-card border border-lounge-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-lounge-yellow">
            <SlidersHorizontal className="w-4 h-4" />
            Шүүлтүүр
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-lounge-yellow animate-spin" />
            <p className="text-lounge-muted text-sm">Ойролцоо lounge хайж байна...</p>
          </div>
        ) : !location ? (
          <div className="text-center py-16 text-lounge-muted text-sm">
            Байршлын зөвшөөрөл олгоод lounge жагсаалтыг хараарай.
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-lounge-border mx-auto mb-3" />
            <p className="text-lounge-muted text-sm">Энэ радиуст lounge олдсонгүй.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-lounge-muted mb-4 uppercase tracking-wider">
              {filteredOrgs.length} lounge олдлоо
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => navigate(`/lounge/${org.id}`)}
                  className="group text-left rounded-2xl bg-lounge-card border border-lounge-border overflow-hidden hover:border-lounge-yellow/50 transition-all hover:shadow-lg hover:shadow-lounge-yellow/5"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={getCoverImage(org)}
                      alt={org.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-lounge-black/80 to-transparent" />
                    {org.distanceMeters != null && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-lounge-black/80 text-lounge-yellow text-xs font-bold border border-lounge-yellow/30">
                        {formatDistance(Number(org.distanceMeters))}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-lounge-yellow transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-xs text-lounge-muted flex items-start gap-1.5 mb-3 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {org.address}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-lounge-muted">
                        <Clock className="w-3.5 h-3.5" />
                        {org.openingTime || org.opening_time} – {org.closingTime || org.closing_time}
                      </span>
                      <span className="flex items-center gap-1 text-lounge-yellow font-semibold">
                        Дэлгэрэнгүй
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </UserLayout>
  );
}
