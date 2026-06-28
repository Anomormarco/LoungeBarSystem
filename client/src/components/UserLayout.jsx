import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Нүүр', path: '/' },
  { label: 'Танилцуулга', path: '/about' },
  { label: 'Restaurant & Lounge', path: '/restaurants-lounges' },
  { label: 'Холбоо барих', path: '/contact' },
];

export default function UserLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-xs font-extrabold transition-colors ${
      isActive
        ? 'bg-lounge-primary text-white shadow-[0_0_12px_rgba(255,168,0,0.2)]'
        : 'text-lounge-muted hover:bg-lounge-card hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-lounge-black text-white">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-lounge-primary/15 via-lounge-accent/5 to-transparent pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between border-b border-lounge-border/40">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-lounge-primary to-lounge-accent flex items-center justify-center font-black text-white text-lg shadow-[0_0_15px_rgba(255,168,0,0.35)]">
            L
          </div>
          <div>
            <span className="font-bold tracking-tight block leading-none">UBLounge</span>

          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-lounge-border bg-lounge-card text-white"
          aria-label="Цэс нээх"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-label="Цэс хаах"
          />
          <aside className="absolute right-0 top-0 h-full w-[min(82vw,320px)] border-l border-lounge-border bg-lounge-black p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lounge-primary to-lounge-accent font-black text-white">
                  L
                </div>
                <span className="font-black">UBLounge</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-lounge-muted hover:bg-lounge-card hover:text-white"
                aria-label="Цэс хаах"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-12 border-t border-lounge-border text-center text-lounge-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Lounge Table Reservation Platform</p>
      </footer>
    </div>
  );
}
