import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users2, 
  Info,
  Check,
  X,
  Loader2,
  Table as TableIcon
} from 'lucide-react';

export default function TableManagement() {
  const { socket } = useSocket();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [type, setType] = useState('normal'); // normal, vip
  const [status, setStatus] = useState('available'); // available, reserved, occupied, disabled, custom
  const [customStatusLabel, setCustomStatusLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await api.getTables();
      setTables(res.data);
    } catch (err) {
      console.error('Tables fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    if (!socket) return;

    // Real-time table updates
    const handleTableCreated = (newTable) => {
      setTables(prev => {
        if (prev.some(t => t.id === newTable.id)) return prev;
        return [...prev, newTable].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
      });
    };

    const handleTableStatusChanged = ({ tableId, status }) => {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    };

    const handleTableDeleted = ({ tableId }) => {
      setTables(prev => prev.filter(t => t.id !== tableId));
    };

    socket.on('table:created', handleTableCreated);
    socket.on('table:status_changed', handleTableStatusChanged);
    socket.on('table:deleted', handleTableDeleted);

    return () => {
      socket.off('table:created', handleTableCreated);
      socket.off('table:status_changed', handleTableStatusChanged);
      socket.off('table:deleted', handleTableDeleted);
    };
  }, [socket]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTableNumber('');
    setCapacity('4');
    setType('normal');
    setStatus('available');
    setCustomStatusLabel('');
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t.id);
    setTableNumber(t.tableNumber);
    setCapacity(t.capacity.toString());
    setType(t.type);
    setStatus(t.status);
    setCustomStatusLabel(t.customStatusLabel || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Энэ ширээг устгахдаа итгэлтэй байна уу?')) return;
    try {
      await api.deleteTable(id);
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert(err.message || 'Устгахад алдаа гарлаа.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableNumber || !capacity) {
      alert('Ширээний дугаар болон суудлын тоог оруулна уу.');
      return;
    }

    setSubmitting(true);
    const payload = {
      tableNumber,
      capacity: parseInt(capacity),
      type,
      status,
      customStatusLabel: status === 'custom' ? customStatusLabel : null,
    };

    try {
      if (editingId) {
        const res = await api.updateTable(editingId, payload);
        setTables(prev => prev.map(t => t.id === editingId ? res.data : t));
      } else {
        const res = await api.createTable(payload);
        setTables(prev => [...prev, res.data].sort((a, b) => a.tableNumber.localeCompare(b.tableNumber)));
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (table) => {
    if (table.status === 'custom' && table.customStatusLabel) {
      return (
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
          {table.customStatusLabel}
        </span>
      );
    }

    switch (table.status) {
      case 'available':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
            Сул
          </span>
        );
      case 'reserved':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            Захиалгатай (Reserved)
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            Хүнтэй (Occupied)
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700">
            Идэвхгүй
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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Ширээний удирдлага</h1>
          <p className="text-slate-400 text-sm">Байгууллагын суудлын зохион байгуулалт, төлөв удирдах</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ширээ нэмэх
        </button>
      </div>

      {/* Grid of Tables */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-500 text-sm">Ширээний жагсаалтыг ачаалж байна...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col items-center justify-center gap-3">
          <TableIcon className="w-10 h-10 text-slate-600" />
          <h3 className="text-slate-300 font-bold">Ширээ бүртгэгдээгүй байна</h3>
          <p className="text-slate-500 text-sm">Баруун дээд булан дахь товчоор шинэ ширээ үүсгэнэ үү.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((t) => (
            <div 
              key={t.id} 
              className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between h-48 group ${
                t.status === 'reserved' 
                  ? 'border-amber-500/20' 
                  : t.status === 'occupied' 
                  ? 'border-red-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header card info */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-sm font-bold">
                      #{t.tableNumber}
                    </div>
                    {t.type === 'vip' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 font-extrabold uppercase rounded-md border border-amber-500/20">
                        VIP
                      </span>
                    )}
                  </div>
                  
                  {/* Actions overlay / hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(t)} 
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-4">
                  <Users2 className="w-4 h-4 text-slate-500" />
                  <span>Багтаамж:</span>
                  <strong className="text-slate-200">{t.capacity} хүний суудал</strong>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2 border-t border-slate-800/40">
                {getStatusBadge(t)}
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
                {editingId ? 'Ширээний мэдээлэл засах' : 'Шинэ ширээ нэмэх'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Ширээний дугаар</label>
                <input
                  type="text"
                  placeholder="Жишээ: 10, VIP-1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Суудлын тоо (Capacity)</label>
                <input
                  type="number"
                  placeholder="4"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Төрөл</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Төлөв</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                  disabled={submitting}
                >
                  <option value="available">Сул</option>
                  <option value="reserved">Захиалгатай (Reserved)</option>
                  <option value="occupied">Хүнтэй (Occupied)</option>
                  <option value="disabled">Идэвхгүй</option>
                  <option value="custom">Өөрчилсөн нэршил (Custom Status)</option>
                </select>
              </div>

              {status === 'custom' && (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase mb-2">Custom Status Нэршил</label>
                  <input
                    type="text"
                    placeholder="Жишээ: Цэвэрлэж байна, Засвартай"
                    value={customStatusLabel}
                    onChange={(e) => setCustomStatusLabel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                    disabled={submitting}
                  />
                  <div className="flex gap-2 items-start mt-2 text-[10px] text-slate-500 leading-normal">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                    <span>
                      Ширээний харагдах төлөвийг хүссэнээрээ нэрлэж болох ба систем дотор available/occupied г.м enum-тэй mapping хийгдэнэ.
                    </span>
                  </div>
                </div>
              )}

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
