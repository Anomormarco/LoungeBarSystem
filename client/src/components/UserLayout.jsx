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
        ? 'bg-lounge-primary/15 text-lounge-accent shadow-[0_0_12px_rgba(255,168,0,0.18)]'
        : 'text-lounge-muted hover:bg-lounge-card hover:text-lounge-accent'
    }`;

  return (
    <div className="min-h-screen bg-[#12110e] text-white">
      <div className="absolute top-0 left-0 w-full h-96 bg-[radial-gradient(circle_at_top,rgba(255,168,0,0.11),transparent_52%)] pointer-events-none" />

      <header className="relative z-10 flex h-16 w-full items-center justify-between border-b border-lounge-border/40 bg-[#12110e]/88 px-4 backdrop-blur sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="ub-script-logo">UBTable</div>
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
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-lounge-border bg-lounge-card text-lounge-accent"
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
          <aside className="absolute right-0 top-0 h-full w-[min(82vw,320px)] border-l border-lounge-border bg-[#12110e] p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="ub-script-logo ub-script-logo-sm">UBTable</div>
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

      <footer className="relative z-10 mt-12 w-full border-t border-lounge-border px-4 py-8 text-center text-xs text-lounge-muted sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Lounge Table Reservation Platform</p>
      </footer>
    </div>
  );
}
