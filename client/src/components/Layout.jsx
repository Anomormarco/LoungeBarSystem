import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Table2,
  Users,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export default function Layout({ children }) {
  const { notifications, unreadCount, connected, markAllAsRead, clearNotifications } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('owner_user') || '{}');
  const orgName = user.organization?.name || 'Миний Lounge';

  useEffect(() => {
    api.getSubscription()
      .then((res) => setSubscription(res.data.organization))
      .catch((err) => console.error('Subscription мэдээлэл авахад алдаа гарлаа:', err));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_user');
    window.location.href = '/login';
  };

  const isExpiringSoon = () => {
    if (!subscription?.subscriptionExpiry) return false;
    const expiry = new Date(subscription.subscriptionExpiry);
    const diffDays = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    return subscription.subscriptionStatus === 'active' && diffDays >= 0 && diffDays <= 3;
  };

  const daysToExpiry = () => {
    if (!subscription?.subscriptionExpiry) return 0;
    const expiry = new Date(subscription.subscriptionExpiry);
    return Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const navItems = [
    { name: 'Хянах самбар', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Ширээний удирдлага', path: '/tables', icon: Table2 },
    { name: 'Меню удирдлага', path: '/menu', icon: UtensilsCrossed },
    { name: 'Ажилтны удирдлага', path: '/staff', icon: Users },
    { name: 'Статистик & тайлан', path: '/statistics', icon: BarChart3 },
    { name: 'Subscription / Төлбөр', path: '/subscription', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              L
            </div>
            <div>
              <span className="font-bold text-slate-100 text-lg tracking-tight block">Lounge Platform</span>
              <span className="text-xs text-slate-500">Owner хянах самбар</span>
            </div>
          </div>
          <button className="lg:hidden p-1 text-slate-400 hover:text-slate-100" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Гарах
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden relative">
        <header className="h-20 bg-slate-900 border-b border-slate-800 px-6 flex justify-between items-center shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-400 hover:text-slate-200" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">{orgName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {subscription?.subscriptionStatus === 'active' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                    Идэвхтэй: {new Date(subscription.subscriptionExpiry).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                    Хаагдсан
                  </span>
                )}

                {connected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-green-500">
                    <Wifi className="w-3.5 h-3.5" /> Шууд холболттой
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-red-500">
                    <WifiOff className="w-3.5 h-3.5" /> Холболт тасарсан
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                markAllAsRead();
              }}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors relative border border-slate-700/50"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-red-500 text-slate-100 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-sm">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                  <h3 className="font-bold text-slate-200">Мэдэгдлүүд</h3>
                  <div className="flex gap-2">
                    <button onClick={clearNotifications} className="text-xs text-slate-500 hover:text-slate-300">Цэвэрлэх</button>
                    <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-500 hover:text-slate-300">Хаах</button>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 text-xs">Мэдэгдэл байхгүй байна.</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className={`font-semibold text-xs ${
                            notification.type === 'success'
                              ? 'text-green-400'
                              : notification.type === 'error'
                                ? 'text-red-400'
                                : 'text-amber-400'
                          }`}>{notification.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(notification.time).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-normal">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {isExpiringSoon() && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-400 leading-normal">
                <strong>Анхаар:</strong> Таны subscription {daysToExpiry()} хоногийн дараа дуусна. Үйлчилгээгээ тасалдуулахгүй байхын тулд төлбөрөө урьдчилан сунгана уу.
              </p>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shrink-0 transition-colors"
            >
              Сунгах
            </button>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
