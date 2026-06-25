import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  Mail,
  QrCode,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    amount: 50000,
    label: '50,000 ₮',
    description: '30 хоногийн үндсэн эрх. Жижиг lounge болон pub-д тохиромжтой.',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    amount: 120000,
    label: '120,000 ₮',
    description: '30 хоногийн бүрэн эрх. Илүү олон ширээ, staff, тайлантай.',
  },
  {
    id: 'annual',
    name: 'Annual Pro',
    amount: 990000,
    label: '990,000 ₮',
    description: 'Жилийн төлбөрийн багц. Backend дээр төлөлт бүр 30 хоногоор сунгана.',
  },
];

function isSubscriptionActive(organization) {
  if (!organization || organization.subscriptionStatus !== 'active' || !organization.subscriptionExpiry) return false;
  return new Date(organization.subscriptionExpiry).getTime() > Date.now();
}

export default function CompanyIntro() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [owner, setOwner] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('owner_user') || 'null');
    } catch {
      return null;
    }
  });
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('owner_token');
  const active = isSubscriptionActive(subscription);

  const fetchSubscription = async () => {
    if (!localStorage.getItem('owner_token')) return;
    setStatusLoading(true);
    setError('');
    try {
      const res = await api.getSubscription();
      setSubscription(res.data.organization);
      setPayments(res.data.payments || []);
    } catch (err) {
      setError(err.message || 'Subscription мэдээлэл авахад алдаа гарлаа.');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSubscription();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.login(email, password);
      const { token: nextToken, owner: nextOwner } = res.data;
      localStorage.setItem('owner_token', nextToken);
      localStorage.setItem('owner_user', JSON.stringify(nextOwner));
      setOwner(nextOwner);
      setSuccess('Нэвтэрлээ. Одоо subscription төлбөрөө үргэлжлүүлнэ үү.');
      await fetchSubscription();
    } catch (err) {
      setError(err.message || 'Нэвтрэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_user');
    setOwner(null);
    setSubscription(null);
    setPayments([]);
    setInvoice(null);
    setSuccess('');
  };

  const handlePayment = async () => {
    if (!selectedPlan || !paymentMethod) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setInvoice(null);
    try {
      if (paymentMethod === 'stripe') {
        const successUrl = `${window.location.origin}/for-owners?payment=success`;
        const cancelUrl = window.location.href;
        const res = await api.createStripeCheckout(selectedPlan.amount, selectedPlan.name, successUrl, cancelUrl);

        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
          return;
        }

        await api.simulateQpayPayment(res.data.payment.id, 'success');
        setSuccess('Dev mode: Stripe төлбөр амжилттай гэж дуурайлгаж, 30 хоногийн эрх идэвхжүүллээ.');
        await fetchSubscription();
      } else {
        const res = await api.createQpayInvoice(selectedPlan.amount, selectedPlan.name);
        setInvoice(res.data);
      }
    } catch (err) {
      setError(err.message || 'Төлбөр үүсгэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockQpaySuccess = async () => {
    if (!invoice) return;
    setLoading(true);
    setError('');
    try {
      await api.simulateQpayPayment(invoice.payment.id, 'success');
      setInvoice(null);
      setSuccess('QPay төлбөр амжилттай. 30 хоногийн эрх идэвхжлээ.');
      await fetchSubscription();
    } catch (err) {
      setError(err.message || 'QPay төлбөр баталгаажуулахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Password амжилттай солигдлоо.');
    } catch (err) {
      setError(err.message || 'Password солиход алдаа гарлаа.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lounge-black text-white">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between border-b border-lounge-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lounge-yellow flex items-center justify-center font-black text-lounge-black text-lg">
            L
          </div>
          <div>
            <span className="font-bold block leading-none">Owner Portal</span>
            <span className="text-[10px] text-lounge-muted uppercase tracking-widest">Subscription & Dashboard</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/" className="px-3 py-2 text-xs font-semibold text-lounge-muted hover:text-lounge-yellow">
            User page
          </Link>
          {owner && (
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-lounge-border text-lounge-muted hover:text-white"
            >
              <LogOut className="inline h-3.5 w-3.5 mr-1" />
              Гарах
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="space-y-6">
            <div>
              <p className="text-lounge-yellow text-sm font-bold mb-3">Owner subscription</p>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Нэвтэрч token аваад Stripe/QPay төлбөрөөр эрхээ сунгана.
              </h1>
              <p className="mt-4 text-lounge-muted leading-relaxed">
                Subscription амжилттай бол тухайн байгууллагын эрх 30 хоног идэвхжинэ. Хугацаа дуусвал owner dashboard, ширээ, меню,
                staff, захиалга, статистикийн API ашиглах эрх түр хаагдана.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {['Owner login required', '30 хоногийн эрх', 'Expired бол API off'].map((item) => (
                <div key={item} className="rounded-xl border border-lounge-border bg-lounge-card p-4 text-sm font-bold text-lounge-yellow">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-lounge-border bg-lounge-card p-5 sm:p-6 shadow-2xl">
            {!owner ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold mb-1">Owner нэвтрэх</h2>
                  <p className="text-sm text-lounge-muted">Token авсны дараа subscription төлбөр үргэлжилнэ.</p>
                </div>
                {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}
                <label className="block">
                  <span className="text-xs font-bold text-lounge-muted uppercase">Имэйл</span>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lounge-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-lounge-border bg-lounge-black py-3 pl-10 pr-3 text-sm outline-none focus:border-lounge-yellow"
                      placeholder="owner@example.com"
                      required
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-lounge-muted uppercase">Нууц үг</span>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lounge-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-lounge-border bg-lounge-black py-3 pl-10 pr-3 text-sm outline-none focus:border-lounge-yellow"
                      placeholder="********"
                      required
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-lounge-yellow py-3 font-extrabold text-lounge-black hover:bg-lounge-yellow-dark disabled:opacity-60"
                >
                  {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Нэвтрээд subscription үргэлжлүүлэх'}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{error}</div>}
                {success && <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">{success}</div>}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold">{owner.organization?.name || owner.name}</h2>
                    <p className="text-sm text-lounge-muted">{owner.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="rounded-xl border border-lounge-yellow/40 px-4 py-2 text-sm font-bold text-lounge-yellow hover:bg-lounge-yellow/10"
                  >
                    Dashboard
                    <ArrowRight className="ml-1 inline h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                  {statusLoading ? (
                    <div className="flex items-center gap-2 text-lounge-yellow text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscription шалгаж байна...
                    </div>
                  ) : active ? (
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-6 w-6 text-green-400" />
                      <div>
                        <p className="font-extrabold text-green-400">Идэвхтэй</p>
                        <p className="text-sm text-lounge-muted">
                          Дуусах огноо: {new Date(subscription.subscriptionExpiry).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-6 w-6 text-red-400" />
                      <div>
                        <p className="font-extrabold text-red-400">Идэвхгүй / хугацаа дууссан</p>
                        <p className="text-sm text-lounge-muted">Төлбөр хийж 30 хоногийн эрхээ идэвхжүүлнэ үү.</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleChangePassword} className="rounded-xl border border-lounge-border bg-lounge-black p-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-lounge-yellow">Password солих</h3>
                    <p className="text-xs text-lounge-muted">Admin өгсөн анхны password-г owner дараа нь өөрөө сольж болно.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="rounded-xl border border-lounge-border bg-lounge-card px-3 py-2 text-sm outline-none focus:border-lounge-yellow"
                      placeholder="Одоогийн password"
                      required
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="rounded-xl border border-lounge-border bg-lounge-card px-3 py-2 text-sm outline-none focus:border-lounge-yellow"
                      placeholder="Шинэ password"
                      minLength={8}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-xl border border-lounge-yellow/40 px-4 py-2 text-xs font-bold text-lounge-yellow hover:bg-lounge-yellow/10 disabled:opacity-60"
                  >
                    {passwordLoading ? 'Сольж байна...' : 'Password солих'}
                  </button>
                </form>

                <div className="grid gap-3 sm:grid-cols-3">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setInvoice(null);
                      }}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        selectedPlan.id === plan.id
                          ? 'border-lounge-yellow bg-lounge-yellow/10'
                          : 'border-lounge-border bg-lounge-black hover:border-lounge-yellow/50'
                      }`}
                    >
                      <p className="font-extrabold">{plan.name}</p>
                      <p className="mt-1 text-lg font-black text-lounge-yellow">{plan.label}</p>
                      <p className="mt-2 text-xs text-lounge-muted">{plan.description}</p>
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('stripe');
                      setInvoice(null);
                    }}
                    className={`rounded-xl border p-4 font-bold ${
                      paymentMethod === 'stripe'
                        ? 'border-lounge-yellow bg-lounge-yellow/10 text-lounge-yellow'
                        : 'border-lounge-border bg-lounge-black text-lounge-muted'
                    }`}
                  >
                    <CreditCard className="mx-auto mb-2 h-6 w-6" />
                    Stripe
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qpay');
                      setInvoice(null);
                    }}
                    className={`rounded-xl border p-4 font-bold ${
                      paymentMethod === 'qpay'
                        ? 'border-lounge-yellow bg-lounge-yellow/10 text-lounge-yellow'
                        : 'border-lounge-border bg-lounge-black text-lounge-muted'
                    }`}
                  >
                    <QrCode className="mx-auto mb-2 h-6 w-6" />
                    QPay
                  </button>
                </div>

                {invoice && (
                  <div className="rounded-xl border border-lounge-border bg-lounge-black p-4 text-center">
                    <div className="mx-auto mb-3 w-fit rounded-xl bg-white p-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoice.qrText)}`}
                        alt="QPay QR"
                        className="h-36 w-36"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleMockQpaySuccess}
                      disabled={loading}
                      className="w-full rounded-xl bg-green-500 py-3 text-sm font-extrabold text-lounge-black disabled:opacity-60"
                    >
                      {loading ? 'Хүлээж байна...' : 'Төлөгдсөн гэж баталгаажуулах'}
                    </button>
                  </div>
                )}

                {!invoice && (
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full rounded-xl bg-lounge-yellow py-3 font-extrabold text-lounge-black hover:bg-lounge-yellow-dark disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        30 хоногийн эрх идэвхжүүлэх
                        <ExternalLink className="ml-2 inline h-4 w-4" />
                      </>
                    )}
                  </button>
                )}

                {payments.length > 0 && (
                  <div className="rounded-xl border border-lounge-border bg-lounge-black p-4">
                    <h3 className="mb-3 font-extrabold">Сүүлийн төлбөрүүд</h3>
                    <div className="space-y-2">
                      {payments.slice(0, 4).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg border border-lounge-border bg-lounge-card px-3 py-2 text-sm">
                          <span>{payment.planType}</span>
                          <span className="font-bold text-lounge-yellow">{Number(payment.amount).toLocaleString()} ₮</span>
                          <span className={payment.paymentStatus === 'success' ? 'text-green-400' : 'text-lounge-muted'}>
                            {payment.paymentStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-xl border border-lounge-border bg-lounge-black p-3 text-xs text-lounge-muted">
                  <CheckCircle className="h-4 w-4 text-lounge-yellow" />
                  Token авсан owner л Stripe/QPay subscription үүсгэнэ. OrganizationId backend дээр token-оос авна.
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
