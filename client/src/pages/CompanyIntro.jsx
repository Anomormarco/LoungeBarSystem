import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle,
  Clock,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { api } from '../utils/api';

const HERO_SLIDES = [
  {
    eyebrow: 'Restaurant & Lounge owners',
    title: 'Lounge, bar, restaurant удирдлагыг нэг dashboard дээр.',
    text: 'UBLounge нь захиалга, ширээ, меню, ажилтан, төлбөрийн эрхийг нэг дор удирдах owner portal өгнө.',
  },
  {
    eyebrow: 'Public map visibility',
    title: '4000ms тутам шинэ санаа, нэг сайт дээр бүх content.',
    text: 'Танай lounge public map дээр зураг, меню, байршил, цагийн мэдээлэлтэй харагдаж хэрэглэгч захиалга үүсгэнэ.',
  },
  {
    eyebrow: 'Realtime reservation flow',
    title: 'Баталгаатай захиалга owner талд шууд ирнэ.',
    text: 'Хэрэглэгч email OTP баталгаажуулсны дараа ширээний захиалга идэвхжиж, dashboard дээр real-time харагдана.',
  },
  {
    eyebrow: 'Subscription access',
    title: 'Эрхээ сунгаад dashboard-оо тасралтгүй ашиглана.',
    text: 'Subscription идэвхтэй үед байгууллага public талд харагдаж, owner dashboard бүрэн ажиллана.',
  },
];

const FEATURES = [
  'Ширээ, меню, ажилтан, захиалга нэг dashboard дээр удирдана.',
  'Хэрэглэгч email кодоор баталгаажуулсны дараа захиалга owner талд ирнэ.',
  'Subscription идэвхтэй үед байгууллага public map дээр харагдана.',
  'Хугацаа дуусвал үйлчилгээ түр идэвхгүй болж, сунгалтаар буцаад нээгдэнэ.',
];

const INITIAL_REGISTER_FORM = {
  ownerName: '',
  email: '',
  password: '',
  phone: '',
  organizationName: '',
  address: '',
  latitude: '47.9184',
  longitude: '106.9177',
  openingTime: '10:00',
  closingTime: '23:00',
  description: '',
};

export default function CompanyIntro() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const activeSlide = HERO_SLIDES[slideIndex];

  const saveOwnerSession = (data) => {
    localStorage.setItem('owner_token', data.token);
    localStorage.setItem('owner_user', JSON.stringify(data.owner));
    window.location.href = '/subscription';
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!loginForm.email || !loginForm.password) {
      setError('Имэйл болон нууц үгээ оруулна уу.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(loginForm.email, loginForm.password);
      saveOwnerSession(response.data);
    } catch (loginError) {
      setError(loginError.message || 'Нэвтрэхэд алдаа гарлаа.');
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.registerOwner({
        ...registerForm,
        latitude: Number(registerForm.latitude),
        longitude: Number(registerForm.longitude),
      });

      setLoginForm({ email: registerForm.email, password: '' });
      setRegisterForm(INITIAL_REGISTER_FORM);
      setMode('login');
      setSuccess('Бүртгэл амжилттай. Одоо owner login хийж нэвтэрнэ үү.');
    } catch (registerError) {
      setError(registerError.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-lounge-black text-white">
      <header className="mx-auto flex h-14 max-w-7xl items-center border-b border-lounge-border px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lounge-yellow text-base font-black text-lounge-black">
            L
          </div>
          <div>
            <span className="block text-sm font-bold leading-none">UBLounge</span>
            <span className="text-[9px] uppercase tracking-widest text-lounge-muted">Owner portal</span>
          </div>
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid items-start gap-8 lg:grid-cols-[0.92fr_0.72fr]">
          <div className="pt-2">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-lounge-yellow">
              {activeSlide.eyebrow}
            </p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              {activeSlide.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-lounge-muted sm:text-base">
              {activeSlide.text}
            </p>

            <div className="mt-6 flex gap-2">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => setSlideIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === slideIndex ? 'w-8 bg-lounge-yellow' : 'w-3 bg-lounge-border'
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-lounge-border bg-lounge-card">
              <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80"
                alt="Restaurant management"
                className="h-[260px] w-full object-cover sm:h-[320px]"
              />
            </div>
          </div>

          <div className="rounded-xl border border-lounge-border bg-lounge-card p-5 shadow-2xl sm:p-6">
            {mode === 'login' ? (
              <OwnerLoginForm
                form={loginForm}
                setForm={setLoginForm}
                loading={loading}
                error={error}
                success={success}
                onSubmit={handleLogin}
                onRegister={() => switchMode('register')}
              />
            ) : (
              <OwnerRegisterForm
                form={registerForm}
                setForm={setRegisterForm}
                loading={loading}
                error={error}
                onSubmit={handleRegister}
                onLogin={() => switchMode('login')}
              />
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: 'Dashboard удирдлага', text: 'Ширээ, меню, ажилтан, захиалга, статистикаа нэг дор харна.' },
            { icon: ShieldCheck, title: 'Баталгаатай захиалга', text: 'Email OTP баталгаажсаны дараа л захиалга owner талд идэвхжинэ.' },
            { icon: UtensilsCrossed, title: 'Public танилцуулга', text: 'Зураг, меню, ширээний мэдээлэл хэрэглэгчийн талд харагдана.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-lounge-border bg-lounge-card p-5">
              <Icon className="mb-4 h-6 w-6 text-lounge-yellow" />
              <h3 className="font-black">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lounge-muted">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-lounge-border bg-lounge-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-lounge-yellow" />
              <h2 className="text-xl font-black">Төлбөрийн мэдээлэл</h2>
            </div>
            <p className="text-sm leading-relaxed text-lounge-muted">
              Байгууллага систем ашиглах эрхээ subscription төлбөрөөр идэвхжүүлнэ. Төлбөр төлөгдсөний дараа тухайн байгууллагын үйлчилгээ public талд харагдаж, owner dashboard бүрэн ажиллана.
            </p>
            <div className="mt-5 space-y-3">
              {[
                { icon: CalendarDays, text: 'Төлбөрийн эрх тодорхой хугацаанд хүчинтэй байна.' },
                { icon: CheckCircle, text: 'Эрх идэвхтэй үед захиалга, ширээ, меню, ажилтан удирдах боломжтой.' },
                { icon: Mail, text: 'Төлбөр, эрх сунгалтын мэдээллийг эзэмшигчид мэдэгдэнэ.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-lg border border-lounge-border bg-lounge-black p-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-lounge-yellow" />
                  <span className="text-sm text-lounge-muted">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-lounge-border bg-lounge-card p-6">
            <h2 className="text-xl font-black">Үндсэн боломжууд</h2>
            <div className="mt-5 grid gap-3">
              {FEATURES.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-lounge-border bg-lounge-black p-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-lounge-yellow" />
                  <span className="text-sm leading-relaxed text-lounge-muted">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function OwnerLoginForm({ form, setForm, loading, error, success, onSubmit, onRegister }) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-black">Owner Login</h2>
        <p className="mt-2 text-sm text-lounge-muted">Бүртгэлтэй owner dashboard руу нэвтэрнэ.</p>
      </div>

      <StatusMessages error={error} success={success} />

      <form onSubmit={onSubmit} className="space-y-4">
        <IconInput
          label="Gmail"
          type="email"
          icon={Mail}
          value={form.email}
          placeholder="owner@gmail.com"
          disabled={loading}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <IconInput
          label="Нууц үг"
          type="password"
          icon={Lock}
          value={form.password}
          placeholder="Aa123!"
          disabled={loading}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
        />

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-lounge-yellow px-5 py-3 text-sm font-black text-lounge-black transition hover:bg-lounge-yellow-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Нэвтрэх
        </button>
      </form>

      <div className="mt-6 border-t border-lounge-border pt-5 text-center">
        <p className="text-sm text-lounge-muted">
          Register?{' '}
          <button type="button" onClick={onRegister} className="font-bold text-lounge-yellow hover:underline">
            Бүртгүүлэх
          </button>
        </p>
      </div>
    </>
  );
}

function OwnerRegisterForm({ form, setForm, loading, error, onSubmit, onLogin }) {
  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Owner Register</h2>
          <p className="mt-2 text-sm text-lounge-muted">Шинэ lounge/bar бүртгээд дараа нь login хийнэ.</p>
        </div>
        <button type="button" onClick={onLogin} className="text-sm font-bold text-lounge-yellow hover:underline">
          Login
        </button>
      </div>

      <StatusMessages error={error} />

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'ownerName', label: 'Owner нэр', icon: User, placeholder: 'Таны нэр' },
            { key: 'phone', label: 'Утас', icon: Phone, placeholder: '99112233', required: false },
            { key: 'email', label: 'Gmail', icon: Mail, placeholder: 'owner@gmail.com', type: 'email' },
            { key: 'password', label: 'Нууц үг', icon: Lock, placeholder: 'Aa123!', type: 'password' },
            { key: 'organizationName', label: 'Байгууллага', icon: Building2, placeholder: 'Lounge нэр' },
            { key: 'address', label: 'Хаяг', icon: MapPin, placeholder: 'Улаанбаатар, СБД' },
          ].map((field) => (
            <IconInput
              key={field.key}
              {...field}
              value={form[field.key]}
              disabled={loading}
              onChange={(value) => updateField(field.key, value)}
            />
          ))}
        </div>

        <div className="border-t border-lounge-border pt-5">
          <p className="mb-4 text-sm font-bold text-lounge-yellow">Байршил ба ажиллах цаг</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: 'latitude', label: 'Latitude', icon: MapPin, placeholder: '47.9184', type: 'number', step: '0.0000001' },
              { key: 'longitude', label: 'Longitude', icon: MapPin, placeholder: '106.9177', type: 'number', step: '0.0000001' },
              { key: 'openingTime', label: 'Нээх цаг', icon: Clock, placeholder: '10:00', type: 'time' },
              { key: 'closingTime', label: 'Хаах цаг', icon: Clock, placeholder: '23:00', type: 'time' },
            ].map((field) => (
              <IconInput
                key={field.key}
                {...field}
                value={form[field.key]}
                disabled={loading}
                onChange={(value) => updateField(field.key, value)}
              />
            ))}
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-lounge-muted">Танилцуулга</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-lounge-border bg-lounge-black px-4 py-3 text-sm text-white outline-none transition focus:border-lounge-yellow"
              placeholder="Lounge-ийн товч танилцуулга"
              disabled={loading}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-lounge-yellow px-5 py-3 text-sm font-black text-lounge-yellow transition hover:bg-lounge-yellow/10 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Бүртгүүлэх
        </button>
      </form>
    </>
  );
}

function IconInput({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  required = true,
  step,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-lounge-muted">{label}</span>
      <span className="flex items-center gap-3 rounded-lg border border-lounge-border bg-lounge-black px-4 py-3 transition focus-within:border-lounge-yellow">
        <Icon className="h-4 w-4 shrink-0 text-lounge-yellow" />
        <input
          type={type}
          step={step}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-lounge-muted"
          placeholder={placeholder}
          disabled={disabled}
        />
      </span>
    </label>
  );
}

function StatusMessages({ error, success }) {
  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}
    </>
  );
}
