import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut } from 'lucide-react';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Статистик', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Байгууллага', path: '/admin/organizations', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-lounge-black text-white flex">
      <aside className="w-64 bg-lounge-card border-r border-lounge-border flex flex-col shrink-0">
        <div className="p-6 border-b border-lounge-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-lounge-yellow flex items-center justify-center font-black text-lounge-black">
              A
            </div>
            <div>
              <span className="font-bold block text-sm">Admin Panel</span>
              <span className="text-[10px] text-lounge-muted">{admin.email}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-lounge-yellow text-lounge-black'
                      : 'text-lounge-muted hover:bg-lounge-black hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-lounge-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            Гарах
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
