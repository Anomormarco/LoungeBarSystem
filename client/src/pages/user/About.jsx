import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Handshake,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  TicketCheck,
  UtensilsCrossed,
  User,
} from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import { api } from '../../utils/api';
import LocationPicker from '../../components/LocationPicker';

const heroImages = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1800&q=85',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1800&q=85',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1800&q=85',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1800&q=85',
  'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=1800&q=85',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1800&q=85',
  'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=1800&q=85',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1800&q=85',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1800&q=85',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1800&q=85',
];

const images = {
  network: [
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=900&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
    'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=900&q=80',
  ],
  business: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1100&q=80',
};

const advantages = [
  {
    icon: UtensilsCrossed,
    title: 'Онцгой сонголт',
    text: 'Luxury lounge, bar, restaurant-уудыг нэг сүлжээнд цэгцтэй харуулна.',
    className: 'md:col-span-7 bg-[#1d1b17]',
  },
  {
    icon: BarChart3,
    title: 'Үр ашигтай маркетинг',
    text: 'Owner байгууллагаа public map дээр харуулж, зорилтот хэрэглэгчдэд ойр хүрнэ.',
    className: 'md:col-span-5 bg-[#2c2a25]',
  },
  {
    icon: TicketCheck,
    title: 'Түргэн захиалга',
    text: 'Хэрэглэгч хэдхэн алхмаар ширээ захиалж, owner тал real-time хүлээн авна.',
    className: 'md:col-span-4 bg-[#2c2a25]',
  },
  {
    icon: Handshake,
    title: 'Түншлэлийн давуу тал',
    text: 'Dashboard, menu, staff, table, subscription урсгалыг нэг системээр удирдана.',
    className: 'md:col-span-8 bg-[#1d1b17]',
  },
];

const venues = [
  { title: 'The Grand Reserve', tag: 'Fine Dining', place: 'Central Tower, 17th Floor' },
  { title: 'Silk Road Pavilion', tag: 'Modern Lounge', place: 'Shangri-La Mall' },
  { title: 'Aura Lounge', tag: 'Exclusive Bar', place: 'Blue Sky Tower' },
];

const initialRegisterForm = {
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

const ownerPlans = [
  { name: 'Start owner access', amount: 50000, periodDays: 30, description: '30 хоногийн owner access' },
  { name: 'Pro owner access', amount: 120000, periodDays: 30, description: '30 хоногийн pro owner access' },
  { name: 'Annual owner access', amount: 990000, periodDays: 365, description: 'Бүтэн жилийн owner access' },
];

export default function About() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [portalView, setPortalView] = useState('info');
  const [portalMode, setPortalMode] = useState(null);
  const [portalError, setPortalError] = useState('');
  const [portalSuccess, setPortalSuccess] = useState('');
  const [pendingOwner, setPendingOwner] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(ownerPlans[0]);
  const [invoice, setInvoice] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('owner_login') === 'true') {
      setPortalView('login');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // QPay is paid inline (no redirect away from this page), so confirmation
  // is polling-based: while an invoice is showing, keep re-checking with
  // QPay itself until it reports paid, then log the new owner straight in -
  // same auto-renew trigger as SubscriptionInfo.jsx (paying sets the
  // organization's subscriptionStatus/expiry from the payment's own
  // periodEnd, see payment.service.js's activatePayment()).
  useEffect(() => {
    const token = pendingOwner?.token || sessionStorage.getItem('pending_owner_token');
    if (!invoice || !token) return undefined;

    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const res = await api.checkQpayStatusWithToken(token, invoice.payment.id);
        if (!active) return;
        if (res.data?.status === 'success') {
          setInvoice(null);
          const owner = pendingOwner || {
            token,
            email: sessionStorage.getItem('pending_owner_email') || loginForm.email,
          };
          sessionStorage.removeItem('pending_owner_token');
          sessionStorage.removeItem('pending_owner_email');
          saveOwnerSession({ token: owner.token, owner: owner.owner });
        }
      } catch (error) {
        console.error('QPay төлбөрийн төлөв шалгахад алдаа гарлаа:', error.message);
      }
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  const saveOwnerSession = (data) => {
    localStorage.setItem('owner_token', data.token);
    localStorage.setItem('owner_user', JSON.stringify(data.owner));
    window.location.href = '/dashboard';
  };

  const handleOwnerLogin = async (event) => {
    event.preventDefault();
    setPortalMode('login');
    setPortalError('');
    setPortalSuccess('');

    try {
      const response = await api.login(loginForm.email, loginForm.password);
      saveOwnerSession(response.data);
    } catch (error) {
      setPortalError(error.message || 'Нэвтрэхэд алдаа гарлаа.');
      setPortalMode(null);
    }
  };

  const handleOwnerRegister = async (event) => {
    event.preventDefault();
    setPortalMode('register');
    setPortalError('');
    setPortalSuccess('');

    try {
      const latitude = Number(registerForm.latitude);
      const longitude = Number(registerForm.longitude);
      const address = String(registerForm.address || '').trim() || `Map location ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      await api.registerOwner({
        ...registerForm,
        address,
        latitude,
        longitude,
      });

      const response = await api.login(registerForm.email, registerForm.password);
      const pending = {
        token: response.data.token,
        email: registerForm.email,
        owner: response.data.owner,
      };

      setPendingOwner(pending);
      sessionStorage.setItem('pending_owner_token', pending.token);
      sessionStorage.setItem('pending_owner_email', pending.email);
      setLoginForm({ email: registerForm.email, password: '' });
      setRegisterForm(initialRegisterForm);
      setInvoice(null);
      setPortalView('payment');
      setPortalSuccess('Бүртгэл үүслээ. Дараагийн алхам: QPay-ээр төлбөрөө хийж owner login эрхээ идэвхжүүлнэ.');
    } catch (error) {
      setPortalError(error.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    } finally {
      setPortalMode(null);
    }
  };

  const handleOwnerQpayPayment = async () => {
    const token = pendingOwner?.token || sessionStorage.getItem('pending_owner_token');

    if (!token) {
      setPortalError('Эхлээд owner бүртгэл үүсгээд дараа нь QPay төлбөрөө хийнэ үү.');
      setPortalView('register');
      return;
    }

    setPortalMode('qpay');
    setPortalError('');
    setPortalSuccess('');

    try {
      const response = await api.createQpayInvoiceWithToken(
        token,
        selectedPlan.amount,
        selectedPlan.name,
        selectedPlan.periodDays,
      );
      setInvoice(response.data);
    } catch (error) {
      setPortalError(error.message || 'QPay төлбөр үүсгэхэд алдаа гарлаа.');
    } finally {
      setPortalMode(null);
    }
  };

  const showPortal = (view) => {
    setPortalView(view);
    setPortalError('');
    setPortalSuccess('');
  };

  return (
    <UserLayout>
      <main className="bg-[#15130f] text-[#e8e1db]">
        <HeroSection heroIndex={heroIndex} />
        <AdvantagesSection />
        <NetworkSection />
        <BusinessSection />

        <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#f2ca50]">Owner onboarding</p>
            <h2 className="text-3xl font-extrabold text-[#e8e1db]">Owner access авах дараалал</h2>
            <p className="mt-3 text-sm leading-6 text-[#d0c5af]">
              Эхлээд байгууллагын мэдээллээ бүртгүүлнэ. Дараа нь QPay-ээр төлбөрөө хийж баталгаажсаны дараа owner login эрх нээгдэнэ.
            </p>
          </div>

          {portalError && (
            <div className="mx-auto mb-6 max-w-md border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200">
              {portalError}
            </div>
          )}
          {portalSuccess && (
            <div className="mx-auto mb-6 max-w-md border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-200">
              {portalSuccess}
            </div>
          )}

          <div className="mx-auto max-w-md">
            {portalView === 'info' ? (
              <OwnerAccessIntro onRegister={() => showPortal('register')} onLogin={() => showPortal('login')} />
            ) : portalView === 'payment' ? (
              <QpayAccessStep
                plans={ownerPlans}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                loading={portalMode === 'qpay'}
                invoice={invoice}
                onPay={handleOwnerQpayPayment}
                onRegister={() => showPortal('register')}
                onLogin={() => showPortal('login')}
              />
            ) : portalView === 'login' ? (
              <LoginPortal
                form={loginForm}
                setForm={setLoginForm}
                loading={portalMode === 'login'}
                onSubmit={handleOwnerLogin}
                onRegister={() => showPortal('info')}
              />
            ) : (
              <RegisterPortal
                form={registerForm}
                setForm={setRegisterForm}
                loading={portalMode === 'register'}
                onSubmit={handleOwnerRegister}
                onBack={() => showPortal('info')}
              />
            )}
          </div>
        </section>
      </main>
    </UserLayout>
  );
}

function HeroSection({ heroIndex }) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt="Luxury lounge interior"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              index === heroIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-5">
          <span className="inline-block border border-[#f2ca50]/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f2ca50]">
            Premium Dining
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-[#e8e1db] sm:text-4xl">
            Luxury Dining Network
          </h1>
          <p className="max-w-lg text-sm leading-7 text-[#d0c5af] sm:text-base">
            Улаанбаатарын luxury lounge, bar, restaurant-уудыг нэг дороос харж, ширээ захиалж, owner тал digital dashboard ашиглана.
          </p>
          <Link
            to="/restaurants-lounges"
            className="inline-flex rounded-sm bg-[#f2ca50] px-5 py-2.5 text-sm font-semibold text-[#3c2f00] transition hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            Join Our Network
          </Link>
          <div className="flex gap-1.5 pt-2">
            {heroImages.map((image, index) => (
              <span
                key={image}
                className={`h-1 rounded-full transition-all ${index === heroIndex ? 'w-6 bg-[#f2ca50]' : 'w-2 bg-white/35'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AdvantagesSection() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold text-[#f2ca50]">Why UBTable?</h2>
        <div className="mx-auto h-1 w-20 bg-[#f2ca50]" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {advantages.map(({ icon: Icon, title, text, className }) => (
          <div key={title} className={`group relative overflow-hidden border border-[#3d372e] p-7 transition hover:border-[#d4af37] ${className}`}>
            <div className="relative z-10 space-y-3">
              <Icon className="h-7 w-7 text-[#f2ca50]" />
              <h3 className="text-lg font-semibold text-[#e8e1db]">{title}</h3>
              <p className="text-sm leading-6 text-[#d0c5af]">{text}</p>
            </div>
            <Star className="absolute -bottom-8 -right-8 h-36 w-36 fill-current text-white/5 transition group-hover:text-white/10" />
          </div>
        ))}
      </div>
    </section>
  );
}

function NetworkSection() {
  return (
    <section className="bg-[#100e0a] py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <h2 className="text-4xl font-extrabold text-[#f2ca50]">Our Network</h2>
            <p className="mt-4 text-base leading-7 text-[#d0c5af]">
              Тансаг орчинтой lounge, bar, restaurant-уудтай хамтран хэрэглэгчдэд хурдан захиалгын урсгал санал болгодог.
            </p>
          </div>
          <Link to="/restaurants-lounges" className="group inline-flex items-center gap-2 font-bold text-[#f2ca50]">
            Бүгдийг харах <ArrowRight className="h-5 w-5 transition group-hover:translate-x-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {venues.map((venue, index) => (
            <div key={venue.title} className="group relative aspect-[4/5] overflow-hidden border border-[#3d372e] transition hover:border-[#d4af37]">
              <img src={images.network[index]} alt={venue.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6">
                <span className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-[#f2ca50]">{venue.tag}</span>
                <h4 className="text-2xl font-semibold text-white">{venue.title}</h4>
                <p className="mt-2 text-sm text-[#d0c5af] opacity-0 transition-opacity group-hover:opacity-100">{venue.place}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10 origin-right translate-y-20 skew-y-3 bg-[#2c2a25]/40" />
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="relative order-2 md:order-1">
          <img src={images.business} alt="Business partnership" className="relative z-10 w-full border border-[#3d372e] object-cover shadow-2xl" />
          <div className="absolute -bottom-6 -right-6 hidden bg-[#f2ca50] p-5 font-bold text-[#3c2f00] lg:block">
            <p className="text-2xl">200+</p>
            <p className="text-xs uppercase tracking-widest">Active Partners</p>
          </div>
        </div>

        <div className="order-1 space-y-6 md:order-2">
          <h2 className="text-4xl font-extrabold leading-tight text-[#e8e1db]">For Business Owners</h2>
          <p className="text-base leading-7 text-[#d0c5af]">
            Байгууллагаа public map дээр харуулж, menu, table, reservation, staff болон subscription эрхээ нэг dashboard-оос удирдана.
          </p>
          <ul className="space-y-4">
            {['Борлуулалтын шинэ суваг', 'Хэрэглэгчийн баталгаатай захиалга', 'Digital захиалгын уян хатан систем'].map((item) => (
              <li key={item} className="flex items-center gap-4 text-[#e8e1db]">
                <CheckCircle2 className="h-5 w-5 text-[#f2ca50]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function OwnerAccessIntro({ onRegister, onLogin }) {
  return (
    <div className="border border-[#3d372e] bg-[#1d1b17] p-6 shadow-2xl">
      <div className="space-y-5">
        {[
          { icon: Building2, title: '1. Байгууллагын мэдээлэл', text: 'Owner нэр, Gmail, lounge/bar нэр, байршил болон ажиллах цагийг бүртгэнэ.' },
          { icon: CreditCard, title: '2. QPay төлбөр', text: 'QPay QR уншуулж сонгосон багцаа төлж owner access идэвхжүүлнэ.' },
          { icon: ShieldCheck, title: '3. Owner login', text: 'Төлбөр амжилттай болсны дараа login хийж dashboard ашиглах эрх нээгдэнэ.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4 rounded-xl border border-[#3d372e] bg-[#15130f] p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#f2ca50]" />
            <div>
              <h3 className="text-sm font-black text-[#e8e1db]">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-[#d0c5af]">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onRegister}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#f2ca50] px-6 py-3 text-sm font-black text-[#211a04] transition hover:brightness-110"
      >
        Бүртгэл эхлүүлэх
        <ArrowRight className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onLogin}
        className="mt-3 inline-flex w-full items-center justify-center border border-[#f2ca50]/60 px-6 py-3 text-sm font-black text-[#f2ca50] transition hover:bg-[#f2ca50]/10"
      >
        QPay төлсөн owner login хийх
      </button>
    </div>
  );
}

function QpayAccessStep({ plans, selectedPlan, setSelectedPlan, loading, invoice, onPay, onRegister, onLogin }) {
  if (invoice) {
    return (
      <div className="border border-[#3d372e] bg-[#1d1b17] p-6 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-2xl font-extrabold text-[#e8e1db]">QPay QR</h3>
          <p className="mt-2 text-sm leading-6 text-[#d0c5af]">
            Доорх QR-г QPay апп-аар уншуулж {selectedPlan.amount.toLocaleString()}₮ төлнө үү. Төлбөр орсныг автоматаар шалгаж, owner login эрхийг шууд идэвхжүүлнэ.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3">
            <img
              src={
                invoice.qrImage
                  ? `data:image/png;base64,${invoice.qrImage}`
                  : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(invoice.qrText)}`
              }
              alt="QPay QR"
              className="h-44 w-44"
            />
          </div>

          {invoice.message && (
            <p className="text-center text-xs leading-relaxed text-[#f2ca50]">{invoice.message}</p>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-[#d0c5af]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Төлбөр хүлээгдэж байна...
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onRegister} className="border border-[#3d372e] px-4 py-2 text-xs font-bold text-[#d0c5af] hover:border-[#f2ca50]/60">
            Бүртгэл засах
          </button>
          <button type="button" onClick={onLogin} className="border border-[#3d372e] px-4 py-2 text-xs font-bold text-[#f2ca50] hover:border-[#f2ca50]/60">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#3d372e] bg-[#1d1b17] p-6 shadow-2xl">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold text-[#e8e1db]">QPay payment</h3>
        <p className="mt-2 text-sm leading-6 text-[#d0c5af]">
          Төлбөр баталгаажсаны дараа дараагийн алхам нь owner login эрхээ ашиглах болно.
        </p>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.name}
            type="button"
            onClick={() => setSelectedPlan(plan)}
            className={`w-full border p-4 text-left transition ${
              selectedPlan.name === plan.name
                ? 'border-[#f2ca50] bg-[#f2ca50]/10'
                : 'border-[#3d372e] bg-[#15130f] hover:border-[#f2ca50]/60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-black text-[#e8e1db]">{plan.name}</h4>
                <p className="mt-1 text-xs text-[#d0c5af]">{plan.description}</p>
              </div>
              <span className="shrink-0 text-sm font-black text-[#f2ca50]">
                {plan.amount.toLocaleString()} ₮
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onPay}
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#f2ca50] px-6 py-3 text-sm font-black text-[#211a04] transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
        QPay QR гаргах
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onRegister} className="border border-[#3d372e] px-4 py-2 text-xs font-bold text-[#d0c5af] hover:border-[#f2ca50]/60">
          Бүртгэл засах
        </button>
        <button type="button" onClick={onLogin} className="border border-[#3d372e] px-4 py-2 text-xs font-bold text-[#f2ca50] hover:border-[#f2ca50]/60">
          Login
        </button>
      </div>
    </div>
  );
}

function LoginPortal({ form, setForm, loading, onSubmit, onRegister }) {
  return (
    <form onSubmit={onSubmit} className="border border-[#3d372e] bg-[#1d1b17] p-6 shadow-2xl">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold text-[#e8e1db]">Owner Login</h3>
        <p className="mt-2 text-sm text-[#d0c5af]">QPay төлбөр баталгаажсан owner dashboard руу нэвтэрнэ.</p>
      </div>

      <div className="space-y-4">
        <PortalInput
          label="Имэйл"
          icon={Mail}
          type="email"
          value={form.email}
          placeholder="owner@gmail.com"
          onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
        />
        <PortalInput
          label="Нууц үг"
          icon={Lock}
          type="password"
          value={form.password}
          placeholder="Aa123!"
          onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#f2ca50] px-6 py-3 text-sm font-black text-[#211a04] transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Нэвтрэх
      </button>

      <button
        type="button"
        onClick={onRegister}
        className="mt-4 inline-flex w-full items-center justify-center border border-[#3d372e] px-6 py-3 text-xs font-bold text-[#d0c5af] hover:border-[#f2ca50]/60"
      >
        Шинээр owner access авах
      </button>
    </form>
  );
}

function RegisterPortal({ form, setForm, loading, onSubmit, onBack }) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={onSubmit} className="border border-[#3d372e] bg-[#1d1b17] p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-[#e8e1db]">Owner Register</h3>
          <p className="mt-2 text-sm text-[#d0c5af]">Бүртгэл үүсгээд дараагийн алхамд QPay төлбөр хийнэ.</p>
        </div>
        <button type="button" onClick={onBack} className="text-sm font-bold text-[#f2ca50] hover:underline">
          Буцах
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { key: 'ownerName', label: 'Owner нэр', icon: User, placeholder: 'Таны нэр' },
          { key: 'phone', label: 'Утас', icon: Phone, placeholder: '99112233', required: false },
          { key: 'email', label: 'Gmail', icon: Mail, placeholder: 'owner@gmail.com', type: 'email' },
          { key: 'password', label: 'Нууц үг', icon: Lock, placeholder: 'Aa123!', type: 'password' },
          { key: 'organizationName', label: 'Байгууллага', icon: Building2, placeholder: 'Lounge нэр' },
          { key: 'openingTime', label: 'Нээх цаг', icon: Clock, placeholder: '10:00', type: 'time' },
          { key: 'closingTime', label: 'Хаах цаг', icon: Clock, placeholder: '23:00', type: 'time' },
        ].map((field) => (
          <PortalInput
            key={field.key}
            {...field}
            value={form[field.key]}
            onChange={(value) => update(field.key, value)}
          />
        ))}
      </div>

      <div className="mt-4">
        <LocationPicker
          latitude={form.latitude}
          longitude={form.longitude}
          address={form.address}
          onAddressChange={(value) => update('address', value)}
          onChange={({ latitude, longitude }) => {
            update('latitude', latitude);
            update('longitude', longitude);
          }}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#a99f8d]">Танилцуулга</span>
        <textarea
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          rows={3}
          className="w-full resize-y border border-[#3d372e] bg-[#15130f] px-4 py-3 text-sm text-[#e8e1db] outline-none placeholder:text-[#6f675b]"
          placeholder="Lounge-ийн товч танилцуулга"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-[#f2ca50] px-6 py-3 text-sm font-black text-[#f2ca50] transition hover:bg-[#f2ca50]/10 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Бүртгээд QPay алхам руу орох
      </button>
    </form>
  );
}

function PortalInput({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = true,
  step,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#a99f8d]">{label}</span>
      <span className="flex items-center gap-3 border border-[#3d372e] bg-[#15130f] px-4 py-3 transition focus-within:border-[#f2ca50]">
        <Icon className="h-4 w-4 shrink-0 text-[#f2ca50]" />
        <input
          type={type}
          step={step}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-[#e8e1db] outline-none placeholder:text-[#6f675b]"
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}
