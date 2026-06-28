import React, { useEffect, useState } from 'react';
import { publicApi } from '../utils/api';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  Shield,
} from 'lucide-react';

export default function ReservationModal({ organization, table, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reservationId, setReservationId] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    reservationDate: today,
    startTime: '18:00',
    guestCount: Math.min(2, table?.capacity || 2),
    guestName: '',
    guestPhone: '',
    guestEmail: '',
  });

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!successMessage) return undefined;

    const timer = setTimeout(() => {
      setSuccessMessage('');
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage, onClose]);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await publicApi.createReservation({
        organizationId: organization.id,
        tableId: table.id,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail,
        reservationDate: form.reservationDate,
        startTime: form.startTime,
        guestCount: Number(form.guestCount),
      });

      const id = res.data.id;
      setReservationId(id);

      await publicApi.sendOtp(form.guestEmail, id);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Захиалга үүсгэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('6 оронтой код оруулна уу.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await publicApi.verifyOtp(form.guestEmail, otpCode, reservationId);
      setSuccessMessage('Захиалга амжилттай баталгаажлаа.');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Баталгаажуулах код буруу эсвэл хугацаа дууссан байна.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-lounge-primary/30 bg-lounge-card shadow-[0_0_30px_rgba(249,115,22,0.25)] sm:max-w-lg sm:rounded-3xl">
        <div className="sticky top-0 z-10 bg-lounge-card/95 border-b border-lounge-border/60 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-white">Ширээ захиалах</h2>
            <p className="text-xs text-lounge-muted">
              Ширээ #{table?.tableNumber} · {table?.capacity} хүн
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-lounge-muted hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0 text-green-400" />
              {successMessage}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-lounge-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-lounge-accent" /> Огноо
                  </label>
                  <input
                    type="date"
                    value={form.reservationDate}
                    min={today}
                    onChange={(e) => updateForm('reservationDate', e.target.value)}
                    className="w-full px-3 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-lounge-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-lounge-accent" /> Зочдын тоо
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={table?.capacity}
                    value={form.guestCount}
                    onChange={(e) => updateForm('guestCount', e.target.value)}
                    className="w-full px-3 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-lounge-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-lounge-accent" /> Эхлэх цаг
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => updateForm('startTime', e.target.value)}
                  className="w-full px-3 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all"
                  required
                />
                <p className="mt-1.5 text-xs text-lounge-muted">
                  Дуусах цагийг lounge-ийн ажиллах цагийн дагуу автоматаар тооцно.
                </p>
              </div>

              <div className="border-t border-lounge-border/60 pt-4 space-y-3">
                <p className="text-xs font-semibold text-lounge-accent uppercase tracking-wider">
                  Холбоо барих мэдээлэл
                </p>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lounge-muted" />
                  <input
                    type="text"
                    placeholder="Нэр"
                    value={form.guestName}
                    onChange={(e) => updateForm('guestName', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lounge-muted" />
                  <input
                    type="tel"
                    placeholder="Утасны дугаар"
                    value={form.guestPhone}
                    onChange={(e) => updateForm('guestPhone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lounge-muted" />
                  <input
                    type="email"
                    placeholder="Имэйл"
                    value={form.guestEmail}
                    onChange={(e) => updateForm('guestEmail', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-lounge-black border border-lounge-border rounded-xl text-sm focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sticky bottom-0 z-10 w-full touch-manipulation py-3.5 bg-gradient-to-r from-lounge-primary to-lounge-accent text-white font-extrabold rounded-xl hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Баталгаажуулах код илгээх'}
              </button>
            </form>
          )}

          {step === 2 && !successMessage && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center py-4">
                <Shield className="w-12 h-12 text-lounge-accent mx-auto mb-3 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                <p className="text-sm text-lounge-muted">
                  <strong className="text-white">{form.guestEmail}</strong> хаяг руу 6 оронтой код илгээлээ.
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                enterKeyHint="done"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 bg-lounge-black border border-lounge-border rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-lounge-accent focus:shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all"
                required
              />

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="sticky bottom-0 z-10 w-full touch-manipulation py-3.5 bg-gradient-to-r from-lounge-primary to-lounge-accent text-white font-extrabold rounded-xl hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Баталгаажуулах'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
