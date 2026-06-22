import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useSocket, playNotificationSound } from '../context/SocketContext';
import { 
  Check, 
  X, 
  CheckCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Search,
  Filter,
  Users2,
  Table,
  BadgeAlert,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { socket } = useSocket();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('today'); // today, tomorrow, all
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const user = JSON.parse(localStorage.getItem('owner_user') || '{}');
  const orgId = user.organizationId;

  const fetchReservations = async () => {
    try {
      const res = await api.getReservations();
      setReservations(res.data);
    } catch (err) {
      console.error('Reservations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    if (!socket) return;

    // Listen to real-time events to update board
    const handleNewReservation = (reservation) => {
      setReservations(prev => {
        // Prevent duplicate entries
        if (prev.some(r => r.id === reservation.id)) return prev;
        return [reservation, ...prev];
      });
    };

    const handleStatusChanged = (updatedRes) => {
      setReservations(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
    };

    socket.on('reservation:new', handleNewReservation);
    socket.on('reservation:confirmed', handleStatusChanged);
    socket.on('reservation:cancelled', handleStatusChanged);
    socket.on('reservation:completed', handleStatusChanged);

    return () => {
      socket.off('reservation:new', handleNewReservation);
      socket.off('reservation:confirmed', handleStatusChanged);
      socket.off('reservation:cancelled', handleStatusChanged);
      socket.off('reservation:completed', handleStatusChanged);
    };
  }, [socket]);

  const handleAction = async (id, type) => {
    setActionLoading(prev => ({ ...prev, [id]: type }));
    try {
      let updated;
      if (type === 'confirm') {
        updated = await api.confirmReservation(id);
      } else if (type === 'cancel') {
        updated = await api.cancelReservation(id);
      } else if (type === 'complete') {
        updated = await api.completeReservation(id);
      }
      setReservations(prev => prev.map(r => r.id === id ? updated.data : r));
    } catch (err) {
      alert(err.message || 'Үйлдэл гүйцэтгэхэд алдаа гарлаа.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  // Date filters helper
  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isTomorrow = (dateStr) => {
    const d = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();
  };

  const filteredReservations = reservations.filter(res => {
    // 1. Date Filter
    if (filterDate === 'today' && !isToday(res.reservationDate)) return false;
    if (filterDate === 'tomorrow' && !isTomorrow(res.reservationDate)) return false;

    // 2. Status Filter
    if (filterStatus !== 'all' && res.status !== filterStatus) return false;

    // 3. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        res.guestName.toLowerCase().includes(q) ||
        res.guestPhone.includes(q) ||
        res.guestEmail.toLowerCase().includes(q) ||
        (res.table?.tableNumber && res.table.tableNumber.toLowerCase().includes(q))
      );
    }

    return true;
  });

  // Calculate top quick statistics
  const pendingCount = reservations.filter(r => r.status === 'pending' && isToday(r.reservationDate)).length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed' && isToday(r.reservationDate)).length;
  const totalToday = reservations.filter(r => isToday(r.reservationDate)).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Realtime indicators */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Захиалгын Удирдах Самбар</h1>
          <p className="text-slate-400 text-sm">Ширээ захиалгуудыг бодит цагт удирдах</p>
        </div>
        <button
          onClick={fetchReservations}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Шинэчлэх
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-5">
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <BadgeAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Өнөөдрийн Хүлээгдэж буй</span>
            <span className="text-3xl font-extrabold text-slate-100">{pendingCount}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-5">
          <div className="p-4 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Өнөөдрийн Баталгаажсан</span>
            <span className="text-3xl font-extrabold text-slate-100">{confirmedCount}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-5">
          <div className="p-4 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Өнөөдрийн Нийт Захиалга</span>
            <span className="text-3xl font-extrabold text-slate-100">{totalToday}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Зочны нэр, утас, ширээний дугаар..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm placeholder-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterDate('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterDate === 'today' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Өнөөдөр
            </button>
            <button
              onClick={() => setFilterDate('tomorrow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterDate === 'tomorrow' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Маргааш
            </button>
            <button
              onClick={() => setFilterDate('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterDate === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Бүгд
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Бүх төлөв</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="confirmed">Баталгаажсан</option>
            <option value="completed">Дууссан</option>
            <option value="cancelled">Цуцлагдсан</option>
          </select>
        </div>
      </div>

      {/* Reservation Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-slate-500 text-sm">Захиалгын мэдээллийг ачаалж байна...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-900 flex flex-col items-center justify-center gap-3">
          <Users2 className="w-10 h-10 text-slate-600" />
          <h3 className="text-slate-300 font-bold">Захиалга олдсонгүй</h3>
          <p className="text-slate-500 text-sm">Шүүлтүүр эсвэл хайлтын утгыг шалгана уу.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredReservations.map((res) => (
            <div 
              key={res.id} 
              className={`p-6 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                res.status === 'pending' 
                  ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' 
                  : res.status === 'confirmed' 
                  ? 'border-green-500/20' 
                  : 'border-slate-800/80 opacity-70'
              }`}
            >
              {/* Header card info */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{res.guestName}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="mx-1">•</span>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(res.reservationDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    res.status === 'pending' 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' 
                      : res.status === 'confirmed' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : res.status === 'completed'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {res.status === 'pending' ? 'Хүлээгдэж буй' : res.status === 'confirmed' ? 'Баталгаажсан' : res.status === 'completed' ? 'Дууссан' : 'Цуцлагдсан'}
                  </span>
                </div>

                {/* Reservation specifications */}
                <div className="grid grid-cols-2 gap-4 py-4 my-2 border-y border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 font-medium">Ширээ:</span>
                    <strong className="text-slate-200">
                      #{res.table?.tableNumber || res.tableId} 
                      {res.table?.type === 'vip' && <span className="ml-1 text-[10px] text-amber-500 font-bold uppercase">(VIP)</span>}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 font-medium">Зочид:</span>
                    <strong className="text-slate-200">{res.guestCount} хүн</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 font-medium">Утас:</span>
                    <strong className="text-slate-200">{res.guestPhone}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 font-medium">Имэйл:</span>
                    <strong className="text-slate-200 truncate max-w-[150px]">{res.guestEmail}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 pt-2">
                {res.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(res.id, 'confirm')}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors disabled:opacity-50"
                      disabled={actionLoading[res.id]}
                    >
                      {actionLoading[res.id] === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Зөвшөөрөх
                    </button>
                    <button
                      onClick={() => handleAction(res.id, 'cancel')}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors disabled:opacity-50"
                      disabled={actionLoading[res.id]}
                    >
                      {actionLoading[res.id] === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Цуцлах
                    </button>
                  </>
                )}

                {res.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleAction(res.id, 'complete')}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors disabled:opacity-50"
                      disabled={actionLoading[res.id]}
                    >
                      {actionLoading[res.id] === 'complete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Дуусгах (Чөлөөлөх)
                    </button>
                    <button
                      onClick={() => handleAction(res.id, 'cancel')}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 rounded-xl text-xs flex justify-center items-center gap-1.5 transition-colors disabled:opacity-50"
                      disabled={actionLoading[res.id]}
                    >
                      Цуцлах
                    </button>
                  </>
                )}

                {['completed', 'cancelled'].includes(res.status) && (
                  <p className="text-slate-500 text-xs italic py-1">Энэ захиалгын процесс дууссан байна.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
