import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../utils/api';
import {
  Loader2,
  Check,
  Ban,
  Trash2,
  Plus,
  X,
  Edit,
} from 'lucide-react';

const STATUS_LABELS = {
  active: 'Идэвхтэй',
  expired: 'Дууссан',
  disabled: 'Хаагдсан',
};

export default function AdminOrganizations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '47.9184',
    longitude: '106.9177',
    openingTime: '10:00',
    closingTime: '23:00',
    phone: '',
    description: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
  });
  const orgFilter = searchParams.get('filter') || 'all';
  const filteredOrganizations = organizations.filter((org) => {
    if (orgFilter === 'active') return org.isApproved && org.subscriptionStatus === 'active';
    if (orgFilter === 'inactive') return !org.isApproved || org.subscriptionStatus !== 'active';
    if (orgFilter === 'expired') return org.subscriptionStatus === 'expired';
    if (orgFilter === 'disabled') return org.subscriptionStatus === 'disabled';
    return true;
  });

  const setOrgFilter = (filter) => {
    setSearchParams(filter === 'all' ? {} : { filter });
  };

  const fetchOrgs = async () => {
    try {
      const res = await adminApi.getOrganizations();
      setOrganizations(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      if (action === 'approve') await adminApi.approveOrganization(id);
      else if (action === 'disable') await adminApi.disableOrganization(id);
      else if (action === 'delete') {
        if (!window.confirm('Устгахдаа итгэлтэй байна уу?')) return;
        await adminApi.deleteOrganization(id);
      }
      await fetchOrgs();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      if (editOrg) {
        delete payload.ownerPassword;
      }
      if (editOrg) {
        await adminApi.updateOrganization(editOrg.id, payload);
      } else {
        await adminApi.createOrganization(payload);
      }
      setShowForm(false);
      setEditOrg(null);
      await fetchOrgs();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (org) => {
    setEditOrg(org);
    setForm({
      name: org.name || '',
      address: org.address || '',
      latitude: String(org.latitude),
      longitude: String(org.longitude),
      openingTime: org.openingTime || '10:00',
      closingTime: org.closingTime || '23:00',
      phone: org.phone || '',
      description: org.description || '',
      ownerName: org.staff?.[0]?.name || '',
      ownerEmail: org.staff?.[0]?.email || '',
      ownerPhone: org.staff?.[0]?.phone || '',
      ownerPassword: '',
    });
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold">Байгууллагууд</h1>
          </div>
          <button
            onClick={() => {
              setEditOrg(null);
              setForm({
                name: '',
                address: '',
                latitude: '47.9184',
                longitude: '106.9177',
                openingTime: '10:00',
                closingTime: '23:00',
                phone: '',
                description: '',
                ownerName: '',
                ownerEmail: '',
                ownerPhone: '',
                ownerPassword: '',
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-lounge-yellow text-lounge-black font-bold rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            Нэмэх
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'Бүгд'],
            ['active', 'Идэвхтэй'],
            ['inactive', 'Идэвхгүй'],
            ['expired', 'Хугацаа дууссан'],
            ['disabled', 'Хаагдсан'],
          ].map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setOrgFilter(filter)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                orgFilter === filter
                  ? 'border-lounge-yellow bg-lounge-yellow text-lounge-black'
                  : 'border-lounge-border bg-lounge-card text-lounge-muted hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowForm(false)} />
            <form
              onSubmit={handleSubmit}
              className="relative w-full max-w-lg bg-lounge-card border border-lounge-border rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{editOrg ? 'Засах' : 'Шинэ байгууллага'}</h3>
                <button type="button" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5 text-lounge-muted" />
                </button>
              </div>

              {['name', 'address', 'phone', 'description'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-lounge-muted uppercase">{field}</label>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-yellow"
                    required={['name', 'address'].includes(field)}
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {['latitude', 'longitude', 'openingTime', 'closingTime'].map((field) => (
                  <div key={field}>
                    <label className="text-xs text-lounge-muted uppercase">{field}</label>
                    <input
                      value={form[field]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-yellow"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-lounge-border space-y-3">
                <div>
                  <p className="text-sm font-bold text-lounge-yellow">Owner account</p>
                  <p className="text-xs text-lounge-muted">
                    Admin owner-ийн анхны нэвтрэх email/password-г нэг удаа тохируулна. Owner дараа нь password-оо солино.
                  </p>
                </div>

                {['ownerName', 'ownerEmail', 'ownerPhone'].map((field) => (
                  <div key={field}>
                    <label className="text-xs text-lounge-muted uppercase">{field}</label>
                    <input
                      type={field === 'ownerEmail' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-yellow"
                      required={!editOrg && ['ownerName', 'ownerEmail'].includes(field)}
                      disabled={Boolean(editOrg)}
                    />
                  </div>
                ))}

                {!editOrg && (
                  <div>
                    <label className="text-xs text-lounge-muted uppercase">ownerPassword</label>
                    <input
                      type="password"
                      value={form.ownerPassword}
                      onChange={(e) => setForm((prev) => ({ ...prev, ownerPassword: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-yellow"
                      required
                      minLength={8}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-lounge-yellow text-lounge-black font-bold rounded-xl"
              >
                Хадгалах
              </button>
            </form>
          </div>
        )}

        {loading && organizations.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-lounge-yellow animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl border border-lounge-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-lounge-card text-lounge-muted text-xs uppercase">
                <tr>
                  <th className="text-left p-4">Нэр</th>
                  <th className="text-left p-4 hidden md:table-cell">Хаяг</th>
                  <th className="text-left p-4">Subscription</th>
                  <th className="text-left p-4 hidden lg:table-cell">Subscription Payment</th>
                  <th className="text-left p-4">Approved</th>
                  <th className="text-right p-4">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lounge-border">
                {filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-lounge-card/50">
                    <td className="p-4 font-semibold">{org.name}</td>
                    <td className="p-4 text-lounge-muted hidden md:table-cell truncate max-w-xs">
                      {org.address}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {org.payments?.[0] ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-lounge-yellow">
                              {org.payments[0].paymentMethod}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                org.payments[0].paymentStatus === 'success'
                                  ? 'bg-green-500/10 text-green-400'
                                  : org.payments[0].paymentStatus === 'pending'
                                  ? 'bg-lounge-yellow/10 text-lounge-yellow'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {org.payments[0].paymentStatus}
                            </span>
                          </div>
                          <p className="text-xs text-lounge-muted">
                            {Number(org.payments[0].amount).toLocaleString()} {String(org.payments[0].currency || '').toUpperCase()}
                          </p>
                          <p className="text-[11px] text-lounge-muted">
                            End: {new Date(org.payments[0].periodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-lounge-muted">No payment</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          org.subscriptionStatus === 'active'
                            ? 'bg-green-500/10 text-green-400'
                            : org.subscriptionStatus === 'expired'
                            ? 'bg-lounge-yellow/10 text-lounge-yellow'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {STATUS_LABELS[org.subscriptionStatus] || org.subscriptionStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      {org.isApproved ? (
                        <span className="text-green-400 text-xs font-bold">✓ Тийм</span>
                      ) : (
                        <span className="text-lounge-muted text-xs">Үгүй</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(org)}
                          className="p-2 text-lounge-muted hover:text-lounge-yellow rounded-lg"
                          title="Засах"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(!org.isApproved || org.subscriptionStatus !== 'active') && (
                          <button
                            onClick={() => handleAction(org.id, 'approve')}
                            disabled={actionLoading[org.id]}
                            className="px-3 py-2 text-xs font-bold text-green-400 border border-green-500/20 hover:bg-green-500/10 rounded-lg"
                            title="Active болгох"
                          >
                            <Check className="inline w-4 h-4 mr-1" />
                            Идэвхтэй
                          </button>
                        )}
                        {org.isApproved && org.subscriptionStatus === 'active' && (
                          <button
                            onClick={() => handleAction(org.id, 'disable')}
                            disabled={actionLoading[org.id]}
                            className="p-2 text-lounge-yellow hover:bg-lounge-yellow/10 rounded-lg"
                            title="Үйл ажиллагаа зогсоох"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(org.id, 'delete')}
                          disabled={actionLoading[org.id]}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Устгах"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrganizations.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-lounge-muted" colSpan={6}>
                      No organizations in this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
