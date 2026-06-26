import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../utils/api';
import { Building2, CreditCard, CalendarCheck, XCircle, Loader2 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, accent = 'text-lounge-yellow', onClick }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full p-6 rounded-2xl bg-lounge-card border border-lounge-border flex items-center gap-5 text-left transition-all ${
        onClick ? 'cursor-pointer hover:border-lounge-yellow hover:bg-lounge-card/80' : ''
      }`}
    >
      <div className={`p-4 rounded-xl bg-lounge-yellow/10 ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <span className="text-lounge-muted text-xs font-bold uppercase tracking-wider block">{label}</span>
        <span className="text-3xl font-extrabold">{value ?? '—'}</span>
      </div>
    </Component>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getStatistics()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold">Платформын Статистик</h1>
          <p className="text-lounge-muted text-sm">Нийт байгууллага, subscription, захиалгын мэдээлэл</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-lounge-yellow animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              icon={Building2}
              label="Organizations"
              value={stats?.totalOrganizations}
              onClick={() => navigate('/admin/organizations?filter=all')}
            />
            <StatCard
              icon={CreditCard}
              label="Идэвхтэй subscription"
              value={stats?.activeSubscriptions}
              accent="text-green-400"
              onClick={() => navigate('/admin/organizations?filter=active')}
            />
            <StatCard
              icon={CalendarCheck}
              label="Нийт захиалга"
              value={stats?.totalReservations}
              accent="text-blue-400"
            />
            <StatCard
              icon={XCircle}
              label="Цуцлагдсан захиалга"
              value={stats?.cancelledReservations}
              accent="text-red-400"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
