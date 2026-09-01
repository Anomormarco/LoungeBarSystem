import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Beer,
  BriefcaseBusiness,
  Heart,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Star,
  UsersRound,
  Wifi,
} from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import { publicApi } from '../../utils/api';

const UB_CENTER = { lat: 47.9184, lng: 106.9177 };

const fallbackImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80';

const personas = [
  {
    id: 'business',
    icon: BriefcaseBusiness,
    eyebrow: 'Мэргэжлийн үйлчилгээ',
    title: 'Бизнес уулзалт',
    text: 'Нам гүм орчин, ВИП ширээ, хурдан үйлчилгээтэй лаунж-ууд.',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=85',
    keywords: ['vip', 'room', 'table', 'skyline', 'monarch', 'prime', 'horizon', 'reserve', 'business'],
  },
  {
    id: 'romantic',
    icon: Heart,
    eyebrow: 'Уур амьсгалтай',
    title: 'Болзоо',
    text: 'Зөөлөн гэрэл, дээвэр тэрраст, хотын дүр зурагтай, тайван уур амьсгалтай газрууд.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900&q=85',
    keywords: ['rooftop', 'terrace', 'luna', 'aria', 'aurora', 'pearl', 'golden', 'velvet', 'view'],
  },
  {
    id: 'family',
    icon: UsersRound,
    eyebrow: 'Уужим',
    title: 'Гэр бүл',
    text: 'Уужим ширээ, хоолны сонголт, тайван сууцтай ресторан лаунж-ууд.',
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900&q=85',
    keywords: ['table', 'garden', 'bistro', 'kitchen', 'cedar', 'jade', 'nomad', 'family', 'food'],
  },
  {
    id: 'friends',
    icon: Beer,
    eyebrow: 'Эрч хүчтэй',
    title: 'Найз нөхөд',
    text: 'Амьд уур амьсгал, коктейль, бар, нийгмийн төрлийн газрууд.',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=85',
    keywords: ['bar', 'social', 'smoke', 'brass', 'onyx', 'copper', 'mint', 'lounge', 'cocktail'],
  },
];

const personaTitles = {
  business: {
    title: 'Бизнес уулзалтад тохиромжтой',
    desc: 'ВИП ширээ, төвийн байршил, тайван орчинтой лаунж-уудыг санал болгож байна.',
  },
  romantic: {
    title: 'Болзоонд тохиромжтой',
    desc: 'Дээвэр тэрраст, тэрраст, романтик нэршил болон уур амьсгалтай газруудыг түрүүлж харууллаа.',
  },
  family: {
    title: 'Гэр бүлээрээ зочлох',
    desc: 'Уужим, ресторан маягийн, хоолны сонголттой газруудыг шүүж харуулж байна.',
  },
  friends: {
    title: 'Найз нөхдийн цугларалтад',
    desc: 'Нийгмийн, бар, лаунж уур амьсгалтай газруудыг сонголтод тань таарууллаа.',
  },
};

function coverImage(org) {
  const images = org.exteriorImages || org.exterior_images || org.interiorImages || org.interior_images || [];
  return Array.isArray(images) && images.length ? images[0] : fallbackImage;
}

function handleImageError(event) {
  if (event.currentTarget.src !== fallbackImage) {
    event.currentTarget.src = fallbackImage;
  }
}

function searchableText(org) {
  return [org.name, org.address, org.description].filter(Boolean).join(' ').toLowerCase();
}

function scoreForPersona(org, persona) {
  const text = searchableText(org);
  const keywordScore = persona.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 3 : 0), 0);
  const vipScore = persona.id === 'business' ? Number(org.vipTableCount || 0) * 2 : Number(org.vipTableCount || 0);
  const availableScore = Math.min(Number(org.availableTableCount || 0), 8);
  const loungeScore = text.includes('lounge') ? 2 : 0;
  const rooftopScore = persona.id === 'romantic' && text.includes('rooftop') ? 4 : 0;

  return keywordScore + vipScore + availableScore + loungeScore + rooftopScore;
}

export default function NeedsDiscovery() {
  const [items, setItems] = useState([]);
  const [activePersona, setActivePersona] = useState('business');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    publicApi.getNearbyOrganizations(UB_CENTER.lat, UB_CENTER.lng, 50)
      .then((res) => {
        if (mounted) setItems(res.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Газруудын жагсаалт ачаалахад алдаа гарлаа.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(6);
  }, [activePersona, query]);

  const selectedPersona = personas.find((item) => item.id === activePersona) || personas[0];
  const resultCopy = personaTitles[activePersona] || personaTitles.business;

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    return items
      .map((org) => ({ ...org, matchScore: scoreForPersona(org, selectedPersona) }))
      .filter((org) => org.matchScore > 0)
      .filter((org) => {
        if (!text) return true;
        return searchableText(org).includes(text);
      })
      .sort((a, b) => b.matchScore - a.matchScore || String(a.name).localeCompare(String(b.name)));
  }, [items, query, selectedPersona]);

  const visibleItems = filtered.slice(0, visibleCount);

  return (
    <UserLayout>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-12">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-lounge-accent">Нээлт</p>
          <h1 className="text-4xl font-extrabold leading-tight text-[#e8e1db] sm:text-5xl">
            Таны зорилго юу вэ?
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-lounge-muted sm:text-base">
            Сонгосон хэрэгцээнд тань нийцэх манай лаунж, бар, ресторан-уудыг системээс шүүж санал болгоно.
          </p>
        </section>

        <section className="mb-16 grid grid-cols-1 gap-5 md:grid-cols-4">
          {personas.map((persona) => {
            const Icon = persona.icon;
            const isActive = activePersona === persona.id;

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setActivePersona(persona.id)}
                className={`group relative aspect-[3/4] overflow-hidden bg-lounge-card text-left transition ${
                  isActive ? 'ring-2 ring-lounge-accent' : 'ring-1 ring-lounge-border hover:ring-lounge-accent/70'
                }`}
              >
                <img
                  src={persona.image}
                  alt={persona.title}
                  onError={handleImageError}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15130f] via-[#15130f]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 z-10 w-full p-6">
                  <div className="mb-2 flex items-center gap-2 text-lounge-accent">
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{persona.eyebrow}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{persona.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-lounge-muted opacity-90 md:opacity-0 md:transition md:group-hover:opacity-100">
                    {persona.text}
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        <section>
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-extrabold text-[#e8e1db]">{resultCopy.title}</h2>
              <p className="mt-2 text-sm leading-6 text-lounge-muted">{resultCopy.desc}</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lounge-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Нэр, хаяг, тайлбараар хайх..."
                className="w-full border border-lounge-border bg-lounge-card py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-lounge-accent"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-lounge-muted">
              <Loader2 className="h-9 w-9 animate-spin text-lounge-accent" />
              Ачаалж байна...
            </div>
          ) : error ? (
            <div className="border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="border border-lounge-border bg-lounge-card p-8 text-center text-sm text-lounge-muted">
              Энэ сонголтод тохирох лаунж одоогоор олдсонгүй.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {visibleItems.map((org) => (
                  <LoungeCard key={org.id} org={org} />
                ))}
              </div>

              {visibleCount < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 6)}
                    className="inline-flex items-center gap-2 border border-lounge-border px-6 py-3 text-sm font-black uppercase tracking-wider text-lounge-accent transition hover:border-lounge-accent hover:bg-lounge-accent/10"
                  >
                    Илүү харах
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </UserLayout>
  );
}

function LoungeCard({ org }) {
  return (
    <Link
      to={`/lounge/${org.id}`}
      state={{ fromHome: true }}
      className="group border border-lounge-border bg-lounge-card transition duration-300 hover:border-lounge-accent hover:shadow-[0_0_24px_rgba(242,202,80,0.14)]"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={coverImage(org)}
          alt={org.name}
          onError={handleImageError}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-4 top-4 flex items-center gap-1 bg-[#15130f]/80 px-3 py-1 text-xs font-black text-lounge-accent backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-current" />
          {Math.min(5, 4.5 + Number(org.matchScore || 0) / 30).toFixed(1)}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-white">{org.name}</h3>
            <p className="mt-1 text-xs font-black uppercase tracking-wider text-lounge-accent">
              ВИП {org.vipTableCount ?? 0} / Сул {org.availableTableCount ?? 0}
            </p>
          </div>
          <span className="text-xs font-black text-lounge-muted">$$$</span>
        </div>
        <div className="mb-5 flex flex-wrap gap-3 text-sm text-lounge-muted">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-lounge-accent" />
            {org.address}
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="h-4 w-4 text-lounge-accent" />
            Баталгаажсан эзэмшигч
          </span>
        </div>
        <span className="block border border-lounge-border py-3 text-center text-sm font-black text-lounge-accent transition group-hover:bg-lounge-accent group-hover:text-lounge-black">
          Ширээ харах
        </span>
      </div>
    </Link>
  );
}
