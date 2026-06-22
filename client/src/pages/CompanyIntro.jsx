import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  Check, 
  Sparkles, 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  Smartphone, 
  CreditCard,
  QrCode,
  ArrowRight,
  Shield,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';

export default function CompanyIntro() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState('1'); // Mocking organization selection
  const [invoice, setInvoice] = useState(null); // Holds QPay Invoice details
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '50,000 ₮',
      amount: 50000,
      periodDays: 30,
      description: 'Жижиг хэмжээний паб болон lounge-д тохиромжтой.',
      features: [
        'Real-time Ширээний төлөв харах',
        'Ширээний бүдүүвч зураг оруулах',
        '10 хүртэлх ширээ удирдах',
        'Нэг ажилтны эрх үүсгэх',
        '7 хоногийн статистик харах',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      price: '120,000 ₮',
      amount: 120000,
      periodDays: 30,
      description: 'Дунд болон том хэмжээний lounge-уудад хамгийн их санал болгож буй багц.',
      features: [
        'Starter багцын бүх боломжууд',
        'Хязгааргүй ширээний удирдлага',
        'Ажилтны бүрэн удирдлага (Manager, Waiter, Cashier)',
        '30 хоногийн статистик & тайлан',
        'Давхар захиалга хамгаалалт (Double-booking protection)',
        'Stripe & QPay төлбөр тооцоо',
      ],
      popular: true,
    },
    {
      id: 'year',
      name: 'Annual Pro',
      price: '990,000 ₮',
      amount: 990000,
      periodDays: 365,
      description: 'Бүтэн жилийн хэрэглээгээ урьдчилан төлж хямдрал авах багц.',
      features: [
        'Pro Pack багцын бүх боломжууд',
        '12 сарын эрх (2 сарын хөнгөлөлттэй)',
        'Шинэ боломжуудыг хамгийн түрүүнд турших эрх',
        'Хувийн зөвлөх ажилтантай болох',
        '24/7 техникийн тусламж үйлчилгээ',
      ],
      popular: false,
    },
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentMethod(null);
    setInvoice(null);
    setPaymentSuccess(false);
    
    // Smooth scroll to payment section
    setTimeout(() => {
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan || !paymentMethod) return;
    setLoading(true);
    setPaymentSuccess(false);

    try {
      if (paymentMethod === 'stripe') {
        // Stripe payment initiation
        const successUrl = `${window.location.origin}/dashboard`;
        const cancelUrl = window.location.href;
        
        const res = await api.createStripeCheckout(
          Number(orgId),
          selectedPlan.amount,
          selectedPlan.name,
          successUrl,
          cancelUrl
        );

        if (res.data.checkoutUrl) {
          // Redirect user to Stripe Checkout
          window.location.href = res.data.checkoutUrl;
        } else {
          // Dev mode or key not configured -> mock checkout
          alert('Dev Mode: Stripe API Key тохируулагдаагүй тул төлбөр амжилттай болсныг дуурайлгаж байна.');
          // Activate directly in dev
          await api.simulateQpayPayment(res.data.payment.id, 'success');
          setPaymentSuccess(true);
          setLoading(false);
        }
      } else if (paymentMethod === 'qpay') {
        // QPay payment initiation
        const res = await api.createQpayInvoice(Number(orgId), selectedPlan.amount, selectedPlan.name);
        setInvoice(res.data);
        setLoading(false);
      }
    } catch (err) {
      alert(err.message || 'Төлбөр гүйцэтгэхэд алдаа гарлаа.');
      setLoading(false);
    }
  };

  const handleMockQpaySuccess = async () => {
    if (!invoice) return;
    setLoading(true);
    try {
      // Simulate bank callback webhook status success
      await api.simulateQpayPayment(invoice.payment.id, 'success');
      setPaymentSuccess(true);
      setInvoice(null);
    } catch (err) {
      alert(err.message || 'Simulate failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-lounge-black text-white min-h-screen relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[150px]" />
      <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px]" />

      {/* Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center border-b border-slate-900 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
            L
          </div>
          <span className="font-bold text-slate-100 text-lg tracking-tight">Lounge Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold text-lounge-muted hover:text-white transition-colors"
          >
            Lounge хайх
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="px-4 py-2 text-sm font-semibold text-lounge-muted hover:text-white transition-colors"
          >
            Нэвтрэх
          </button>
          <button 
            onClick={() => {
              document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/10"
          >
            Эхлэх
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-6 text-sm font-medium">
          <Sparkles className="w-4 h-4" /> Real-time Lounge Ширээ Захиалгын Нэгдсэн Платформ
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 tracking-tight max-w-4xl mx-auto leading-tight mb-8">
          Танай Lounge-ийг <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">ухаалгаар удирдах</span> шийдэл
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Элдэв хэрэглэгчийн бүртгэлгүй, байршил-суурьтай хайлт болон Real-time ширээний зураглалаар захиалга хөрвүүлэлтийг 3 дахин нэмэгдүүлнэ.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button 
            onClick={() => {
              document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-2xl shadow-xl shadow-amber-500/20 flex justify-center items-center gap-2 group transition-all"
          >
            Багцууд үзэх
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold rounded-2xl transition-colors"
          >
            Эзэмшигч нэвтрэх
          </button>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-100">Давуу талууд</h2>
          <p className="text-slate-400 mt-2">Хамгийн орчин үеийн боломжуудыг нэг дор цогцлоосон.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-all group">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 w-fit mb-6 border border-amber-500/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-200">Real-time захиалга</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Шинэ захиалга орж ирэхэд таны дэлгэц дээр дуут дохио болон мэдээллээр шууд харагдах ба ширээний статус автоматаар шинэчлэгдэнэ.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-all group">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 w-fit mb-6 border border-amber-500/20">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-200">Ширээний бүдүүвч зураг</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Эзэмшигч өөрийн Lounge-ийн ширээний байршлыг өөрчлөн тохируулах болон монгол нэршлээр статус үүсгэн удирдах боломжтой.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-all group">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 w-fit mb-6 border border-amber-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-200">Статистик & Хяналт</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              7 хоног болон сараар хамгийн их захиалга авч буй цаг, хамгийн ашигтай ширээ, орлогын тренд зэрэг үзүүлэлтийг хянах боломж.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Plans */}
      <section id="pricing-section" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-100">Subscription Багцууд</h2>
          <p className="text-slate-400 mt-2">Бизнесийнхээ хэмжээнд тохируулан сонгоно уу.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`p-8 rounded-3xl flex flex-col justify-between transition-all relative ${
                plan.popular 
                  ? 'bg-slate-900 border-2 border-amber-500 shadow-xl shadow-amber-500/5' 
                  : 'bg-slate-900/50 border border-slate-800'
              } ${selectedPlan?.id === plan.id ? 'ring-2 ring-amber-500 ring-offset-4 ring-offset-slate-950' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-full uppercase tracking-wider">
                  Хамгийн эрэлттэй
                </span>
              )}
              
              <div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{plan.description}</p>
                
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-extrabold text-slate-100">{plan.price}</span>
                  <span className="text-slate-500 text-sm">/ {plan.periodDays === 365 ? 'жил' : 'сар'}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                      <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
                  plan.popular
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                Багц сонгох
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Payment / Subscription Activation Section */}
      {selectedPlan && (
        <section id="payment-section" className="max-w-3xl mx-auto px-6 py-20 border-t border-slate-900/60 relative z-10">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Төлбөр төлөх & Идэвхжүүлэх</h3>
            <p className="text-slate-400 text-sm mb-6">
              Сонгосон багц: <strong className="text-amber-500">{selectedPlan.name}</strong> ({selectedPlan.price})
            </p>

            {paymentSuccess ? (
              <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center space-y-4">
                <Shield className="w-12 h-12 text-green-500 mx-auto" />
                <h4 className="text-xl font-bold text-slate-100">Төлбөр амжилттай баталгаажлаа!</h4>
                <p className="text-slate-400 text-sm">
                  Lounge-ийн эрх сэргэж, идэвхтэй төлөвт шилжлээ. Та одоо систем рүү нэвтэрч ашиглах боломжтой.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl transition-all"
                >
                  Dashboard руу орох
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Байгууллагын ID сонгох (Тест)</label>
                  <input
                    type="number"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
                    placeholder="Жишээ: 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Төлбөрийн хэлбэр</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setPaymentMethod('stripe'); setInvoice(null); }}
                      className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-8 h-8" />
                      <span className="font-bold text-xs uppercase tracking-wider">Stripe (Картаар)</span>
                    </button>
                    
                    <button
                      onClick={() => { setPaymentMethod('qpay'); setInvoice(null); }}
                      className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                        paymentMethod === 'qpay'
                          ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <QrCode className="w-8 h-8" />
                      <span className="font-bold text-xs uppercase tracking-wider">QPay (QR Code)</span>
                    </button>
                  </div>
                </div>

                {invoice && (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center space-y-4">
                    <div className="p-3 bg-white rounded-2xl">
                      {/* Generates placeholder QR */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(invoice.qrText)}`} 
                        alt="QPay QR" 
                        className="w-44 h-44"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-slate-500 text-xs">Simulated Invoice ID</span>
                      <p className="font-semibold text-xs text-slate-400">{invoice.invoiceId}</p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={handleMockQpaySuccess}
                        className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-xl text-xs flex justify-center items-center gap-2"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Төлбөр төлөгдсөн (Тест дуурайлгах)'}
                      </button>
                    </div>
                  </div>
                )}

                {!invoice && (
                  <button
                    onClick={handleProcessPayment}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl transition-all shadow-lg shadow-amber-500/10 flex justify-center items-center gap-2"
                    disabled={loading || !paymentMethod}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Багц Идэвхжүүлэх
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 text-center text-slate-600 text-xs">
        <p>&copy; {new Date().getFullYear()} Lounge Table Reservation Platform. Бүх эрх хамгаалагдсан.</p>
      </footer>
    </div>
  );
}
