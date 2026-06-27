import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import ReservationModal from '../../components/ReservationModal';
import { UserSocketProvider, useUserSocket } from '../../context/UserSocketContext';
import { publicApi } from '../../utils/api';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Loader2,
  Wifi,
  WifiOff,
  UtensilsCrossed,
  Table2,
  Crown,
} from 'lucide-react';

const STATUS_CONFIG = {
  available: { label: 'Сул', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  reserved: { label: 'Захиалгатай', color: 'bg-lounge-yellow/20 text-lounge-yellow border-lounge-yellow/30' },
  occupied: { label: 'Дүүрсэн', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  disabled: { label: 'Идэвхгүй', color: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' },
  custom: { label: 'Тусгай', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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

function LoungeDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { connected, tableUpdates, clearTableUpdate } = useUserSocket();

  const [organization, setOrganization] = useState(null);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tables');
  const [selectedTable, setSelectedTable] = useState(null);
  const [galleryTab, setGalleryTab] = useState('exterior');

  const fetchData = useCallback(async () => {
    try {
      const [orgRes, tablesRes, menuRes] = await Promise.all([
        publicApi.getOrganization(id),
        publicApi.getOrganizationTables(id),
        publicApi.getOrganizationMenu(id),
      ]);
      setOrganization(orgRes.data);
      setTables(tablesRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      setError(err.message || 'Мэдээлэл ачаалахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!tableUpdates) return;

    if (tableUpdates.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableUpdates.tableId ? { ...t, status: tableUpdates.status } : t
        )
      );
    } else if (tableUpdates.refresh) {
      publicApi.getOrganizationTables(id).then((res) => setTables(res.data || []));
    }

    clearTableUpdate();
  }, [tableUpdates, id, clearTableUpdate]);

  const exteriorImages = organization?.exteriorImages || [];
  const interiorImages = organization?.interiorImages || [];
  const galleryImages = galleryTab === 'exterior' ? exteriorImages : interiorImages;
  const closeDetail = () => {
    if (routeLocation.state?.fromHome) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Бусад';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="w-10 h-10 text-lounge-accent animate-spin" />
          <p className="text-lounge-muted text-sm">Ачаалж байна...</p>
        </div>
      </UserLayout>
    );
  }

  if (error || !organization) {
    return (
      <UserLayout>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-red-400 mb-4">{error || 'Lounge олдсонгүй.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-gradient-to-r from-lounge-primary to-lounge-accent text-white font-extrabold rounded-lg hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-300"
          >
            Буцах
          </button>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div
        className="min-h-screen"
        onClick={() => {
          if (!selectedTable) closeDetail();
        }}
      >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={closeDetail}
          className="flex items-center gap-2 text-sm text-lounge-muted hover:text-lounge-accent mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </button>

        {/* Hero gallery */}
        <div className="rounded-2xl overflow-hidden border border-lounge-border/60 mb-8">
          <div className="flex border-b border-lounge-border/60">
            {['exterior', 'interior'].map((tab) => (
              <button
                key={tab}
                onClick={() => setGalleryTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  galleryTab === tab
                    ? 'bg-lounge-primary text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                    : 'bg-lounge-card text-lounge-muted hover:text-white'
                }`}
              >
                {tab === 'exterior' ? 'Гадна тал' : 'Дотор тал'}
              </button>
            ))}
          </div>

          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {galleryImages.slice(0, 6).map((img, i) => (
                <div key={i} className={`overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={img} alt="" className="w-full h-full object-cover min-h-[120px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 bg-lounge-card flex items-center justify-center text-lounge-muted text-sm">
              Зураг байхгүй
            </div>
          )}
        </div>

        {/* Info header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-2 text-white">{organization.name}</h1>
              {organization.description && (
                <p className="text-lounge-muted text-sm mb-3 max-w-2xl">{organization.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-lounge-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-lounge-accent" />
                  {organization.address}
                </span>
                {organization.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-lounge-accent" />
                    {organization.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-lounge-accent" />
                  {organization.openingTime} – {organization.closingTime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-lounge-card border border-lounge-border text-xs">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold">Real-time</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-red-400">Холбогдож байна...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-lounge-border/60 pb-px">
          {[
            { id: 'tables', label: 'Ширээний зураг', icon: Table2 },
            { id: 'menu', label: 'Меню', icon: UtensilsCrossed },
          ].map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tabId
                  ? 'border-lounge-accent text-lounge-accent font-extrabold'
                  : 'border-transparent text-lounge-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Table map */}
        {activeTab === 'tables' && (
          <div>
            <p className="text-xs text-lounge-muted mb-4">
              Ногоон = сул ширээ. Сул ширээ дээр дарж захиалга өгнө.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => {
                const isAvailable = table.status === 'available';
                return (
                  <button
                    key={table.id}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && setSelectedTable(table)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isAvailable
                        ? 'bg-lounge-card border-lounge-border hover:border-lounge-accent hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] cursor-pointer'
                        : 'bg-lounge-black/50 border-lounge-border/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-lg text-white">#{table.tableNumber}</span>
                      {table.type === 'vip' && (
                        <Crown className="w-4 h-4 text-lounge-primary" />
                      )}
                    </div>
                    <p className="text-xs text-lounge-muted mb-2">{table.capacity} хүн</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(table)}`}>
                      {getStatusLabel(table)}
                    </span>
                  </button>
                );
              })}
            </div>

            {tables.length === 0 && (
              <p className="text-center text-lounge-muted py-12 text-sm">Ширээ бүртгэгдээгүй байна.</p>
            )}
          </div>
        )}

        {/* Menu */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-lg font-bold text-lounge-accent mb-4 border-b border-lounge-border/60 pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-2xl bg-lounge-card border border-lounge-border/60"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-white">{item.name}</h4>
                          <span className="text-lounge-accent font-bold shrink-0">
                            {Number(item.price).toLocaleString()} ₮
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-lounge-muted mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {menuItems.length === 0 && (
              <p className="text-center text-lounge-muted py-12 text-sm">Меню байхгүй байна.</p>
            )}
          </div>
        )}
      </div>
      </div>

      {selectedTable && (
        <ReservationModal
          organization={organization}
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onSuccess={() => {
            publicApi.getOrganizationTables(id).then((res) => setTables(res.data || []));
          }}
        />
      )}
    </UserLayout>
  );
}

export default function LoungeDetail() {
  const { id } = useParams();

  return (
    <UserSocketProvider organizationId={Number(id)}>
      <LoungeDetailContent />
    </UserSocketProvider>
  );
}
