import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-lounge-black text-white">
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-lounge-yellow/10 to-transparent pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between border-b border-lounge-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lounge-yellow flex items-center justify-center font-black text-lounge-black text-lg">
            L
          </div>
          <div>
            <span className="font-bold tracking-tight block leading-none">Lounge Reserve</span>
            <span className="text-[10px] text-lounge-muted uppercase tracking-widest">Ойролцоо lounge хайх</span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isActive ? 'bg-lounge-yellow/10 text-lounge-yellow' : 'text-lounge-muted hover:text-lounge-yellow'
              }`
            }
          >
            Lounge хайх
          </NavLink>
        </nav>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-12 border-t border-lounge-border text-center text-lounge-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Lounge Table Reservation Platform</p>
      </footer>
    </div>
  );
}
