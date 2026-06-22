import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Building2, ArrowRight } from 'lucide-react';

export default function UserLayout({ children }) {
  const navigate = useNavigate();

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

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/for-owners"
            className="hidden sm:inline text-xs text-lounge-muted hover:text-lounge-yellow transition-colors"
          >
            Эзэмшигчид
          </Link>
          <button
            onClick={() => navigate('/login')}
            className="px-3 sm:px-4 py-2 text-xs font-semibold text-lounge-yellow border border-lounge-yellow/30 rounded-lg hover:bg-lounge-yellow/10 transition-colors"
          >
            Owner Login
          </button>
        </nav>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-12 border-t border-lounge-border text-center text-lounge-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Lounge Table Reservation Platform</p>
      </footer>
    </div>
  );
}
