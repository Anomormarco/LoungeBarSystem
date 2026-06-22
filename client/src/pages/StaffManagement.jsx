import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldAlert,
  Check,
  X,
  Loader2,
  Users,
  Shield,
  Phone,
  Mail
} from 'lucide-react';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('waiter'); // manager, waiter, cashier
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await api.getOwnerStaff();
      setStaffList(res.data);
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setRole('waiter');
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setEditingId(member.id);
    setName(member.name);
    setPhone(member.phone || '');
    setEmail(member.email);
    setPassword(''); // Leave blank unless changing
    setRole(member.role);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const currentManager = JSON.parse(localStorage.getItem('owner_user') || '{}');
    if (currentManager.id === id) {
      alert('Та одоо нэвтэрсэн байгаа өөрийн бүртгэлийг устгах боломжгүй.');
      return;
    }

    if (!window.confirm('Энэ ажилтныг устгах уу?')) return;
    try {
      await api.deleteStaff(id);
      setStaffList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message || 'Устгахад алдаа гарлаа.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !role) {
      alert('Нэр, имэйл болон эрхийг оруулна уу.');
      return;
    }

    if (!editingId && !password) {
      alert('Шинэ ажилтанд нэвтрэх нууц үг оруулна уу.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      phone: phone || null,
      email,
      role,
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingId) {
        const res = await api.updateStaff(editingId, payload);
        setStaffList(prev => prev.map(item => item.id === editingId ? res.data : item));
      } else {
        const res = await api.createStaff(payload);
        setStaffList(prev => [...prev, res.data]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shield className="w-3.5 h-3.5" /> Менежер (Manager)
          </span>
        );
      case 'waiter':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
            Зөөгч (Waiter)
          </span>
        );
      case 'cashier':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Касс (Cashier)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Ажилтны удирдлага</h1>
          <p className="text-slate-400 text-sm">Байгууллагын ажилчид, тэдгээрийн нэвтрэх эрх удирдах</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ажилтан нэмэх
        </button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-500 text-sm">Ажилчдын жагсаалтыг ачаалж байна...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col items-center justify-center gap-3">
          <Users className="w-10 h-10 text-slate-600" />
          <h3 className="text-slate-300 font-bold">Ажилтан бүртгэгдээгүй байна</h3>
          <p className="text-slate-500 text-sm">Эзэмшигчээс гадна менежер, зөөгч эсвэл касс нэмэх боломжтой.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {staffList.map((member) => (
            <div 
              key={member.id} 
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 transition-all hover:border-slate-700 flex flex-col justify-between group relative"
            >
              {/* Actions Overlay */}
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(member)} 
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(member.id)} 
                  className="p-1 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{member.name}</h3>
                  <div className="mt-1.5">{getRoleBadge(member.role)}</div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-800/40 pt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{member.phone || 'Утас оруулаагүй'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? 'Ажилтны мэдээлэл засах' : 'Шинэ ажилтан нэмэх'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Нэр</label>
                <input
                  type="text"
                  placeholder="Бүтэн нэр"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Утасны дугаар</label>
                <input
                  type="text"
                  placeholder="Утасны дугаар"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Имэйл хаяг (Нэвтрэх нэр)</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">
                  {editingId ? 'Нууц үг (Зөвхөн шинэчлэх бол оруулна уу)' : 'Нэвтрэх нууц үг'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Үүрэг (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                >
                  <option value="waiter">Зөөгч (Waiter)</option>
                  <option value="cashier">Касс (Cashier)</option>
                  <option value="manager">Менежер (Manager)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm flex justify-center items-center gap-2"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Хадгалах'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
