import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { Loader2, MapPin, Search, Star, UtensilsCrossed } from 'lucide-react';
import { publicApi } from '../../utils/api';

const UB_CENTER = { lat: 47.9184, lng: 106.9177 };

function coverImage(org) {
  const images = org.exteriorImages || org.exterior_images || org.interiorImages || org.interior_images || [];
  return Array.isArray(images) && images.length
    ? images[0]
    : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80';
}

export default function RestaurantsLounges() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    publicApi.getNearbyOrganizations(UB_CENTER.lat, UB_CENTER.lng, 20)
      .then((res) => {
        if (mounted) setItems(res.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Restaurant & lounge жагсаалт ачаалахад алдаа гарлаа.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) =>
      [item.name, item.address, item.description].filter(Boolean).some((value) => value.toLowerCase().includes(text))
    );
  }, [items, query]);

  return (
    <UserLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lounge-accent text-sm font-black mb-2">Places</p>
            <h1 className="text-3xl sm:text-5xl font-black text-white">Restaurant & Lounge-ууд</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-lounge-muted">
              Улаанбаатар хотын ойролцоох идэвхтэй газруудыг сонгоод, дэлгэрэнгүй мэдээлэл болон сул ширээг харна.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lounge-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Нэр, хаягаар хайх..."
              className="w-full rounded-xl border border-lounge-border bg-lounge-card py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-lounge-accent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-lounge-muted">
            <Loader2 className="h-9 w-9 animate-spin text-lounge-accent" />
            Ачаалж байна...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((org) => (
              <Link
                key={org.id}
                to={`/lounge/${org.id}`}
                state={{ fromHome: true }}
                className="group overflow-hidden rounded-2xl border border-lounge-border bg-lounge-card transition-all hover:border-lounge-accent/60 hover:shadow-[0_0_24px_rgba(255,168,0,0.12)]"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={coverImage(org)}
                    alt={org.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
                    {org.availableTableCount ?? 0} сул ширээ
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-black text-white">{org.name}</h2>
                    <span className="flex items-center gap-1 rounded-full bg-lounge-primary/15 px-2 py-1 text-xs font-black text-lounge-accent">
                      <Star className="h-3.5 w-3.5" />
                      VIP {org.vipTableCount ?? 0}
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-2 text-sm text-lounge-muted">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lounge-accent" />
                    {org.address}
                  </p>
                  {org.description && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-lounge-muted">
                      {org.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-lounge-border/60 pt-4 text-xs font-black">
                    <span className="flex items-center gap-2 text-lounge-muted">
                      <UtensilsCrossed className="h-4 w-4 text-lounge-accent" />
                      Дэлгэрэнгүй
                    </span>
                    <span className="text-lounge-accent">Ширээ харах</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-lounge-muted">Тохирох газар олдсонгүй.</p>
        )}
      </section>
    </UserLayout>
  );
}
