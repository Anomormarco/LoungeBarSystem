import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function UserLayout({ children }) {
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

        <nav className="flex items-center gap-2">
          
        </nav>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-12 border-t border-lounge-border text-center text-lounge-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Lounge Table Reservation Platform</p>
      </footer>
    </div>
  );
}
