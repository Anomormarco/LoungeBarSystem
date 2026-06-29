import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import {
  Calendar,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

export default function SubscriptionInfo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const plans = [
    { name: 'Старт багц', amount: 50000, periodDays: 30, description: '30 хоногийн эрх (50,000 ₮)' },
    { name: 'Про багц', amount: 120000, periodDays: 30, description: '30 хоногийн эрх (120,000 ₮)' },
    { name: 'Жилийн про багц', amount: 990000, periodDays: 365, description: 'Бүтэн жилийн эрх (990,000 ₮)' },
  ];

  const fetchSubscription = async () => {
    try {
      const res = await api.getSubscription();
      setData(res.data);
    } catch (err) {
      console.error('Subscription мэдээлэл авахад алдаа гарлаа:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    if (new URLSearchParams(window.location.search).get('success') === 'true') {
      setPaymentSuccess(true);
    }
  }, []);

  const handlePay = async () => {
    if (!selectedPlan || !paymentMethod) return;
    setSubmitting(true);
    setPaymentSuccess(false);

    try {
      if (paymentMethod === 'stripe') {
        const successUrl = `${window.location.origin}/subscription?success=true`;
        const cancelUrl = window.location.href;
        const res = await api.createStripeCheckout(
          selectedPlan.amount,
          selectedPlan.name,
          successUrl,
          cancelUrl,
          selectedPlan.periodDays,
        );

        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          alert(res.data.message || 'Stripe key тохируулагдаагүй байна. STRIPE_SECRET_KEY, STRIPE_PRICE_ID болон webhook тохируулсны дараа картын төлбөр ажиллана.');
        }
      } else if (paymentMethod === 'qpay') {
        const res = await api.createQpayInvoice(selectedPlan.amount, selectedPlan.name, selectedPlan.periodDays);
        setInvoice(res.data);
      }
    } catch (err) {
      alert(err.message || 'Төлбөр гүйцэтгэхэд алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockQpaySuccess = async () => {
    if (!invoice) return;
    setSubmitting(true);
    try {
      await api.simulateQpayPayment(invoice.payment.id, 'success');
      setPaymentSuccess(true);
      setInvoice(null);
      fetchSubscription();
    } catch (err) {
      alert(err.message || 'QPay төлбөр баталгаажуулахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageStripeBilling = async () => {
    setSubmitting(true);
    try {
      const res = await api.createStripePortal(window.location.href);
      if (res.data.portalUrl) {
        window.location.href = res.data.portalUrl;
      }
    } catch (err) {
      alert(err.message || 'Stripe төлбөрийн удирдлага нээхэд алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Subscription / Төлбөр тооцоо</h1>
        <p className="text-slate-400 text-sm">Платформын ашиглах хугацаа болон төлбөрийн түүхээ хянах хэсэг</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      ) : !data ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-slate-400">Мэдээлэл олдсонгүй.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200 text-base">Идэвхтэй багцын мэдээлэл</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <span className="text-slate-500 text-xs font-semibold block uppercase">Платформын төлөв</span>
                  <div className="flex items-center gap-2">
                    {data.organization.subscriptionStatus === 'active' ? (
                      <span className="text-green-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-5 h-5 text-green-400" /> Идэвхтэй
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <XCircle className="w-5 h-5 text-red-400" /> Хугацаа дууссан
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <span className="text-slate-500 text-xs font-semibold block uppercase">Дуусах хугацаа</span>
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>
                      {data.organization.subscriptionExpiry
                        ? new Date(data.organization.subscriptionExpiry).toLocaleDateString()
                        : 'Тохируулаагүй'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {data.payments.some((payment) => payment.paymentMethod === 'stripe' && payment.stripeCustomerId) && (
              <button
                type="button"
                onClick={handleManageStripeBilling}
                disabled={submitting}
                className="w-full rounded-xl border border-lounge-yellow/40 px-4 py-3 text-sm font-extrabold text-lounge-yellow hover:bg-lounge-yellow/10 disabled:opacity-60"
              >
                Stripe төлбөрийн удирдлага нээх
              </button>
            )}

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200 text-base">Төлбөр төлөлтийн түүх</h3>

              {data.payments.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-6 text-center">Төлбөрийн түүх байхгүй байна.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-2">Багцын нэр</th>
                        <th className="py-3 px-2">Төлбөрийн хэлбэр</th>
                        <th className="py-3 px-2">Төлсөн дүн</th>
                        <th className="py-3 px-2">Төлөв</th>
                        <th className="py-3 px-2">Огноо</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {data.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="py-3.5 px-2 font-semibold text-slate-200">{payment.planType}</td>
                          <td className="py-3.5 px-2 uppercase">{payment.paymentMethod}</td>
                          <td className="py-3.5 px-2 font-bold text-amber-500">
                            {Number(payment.amount).toLocaleString()} ₮
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              payment.paymentStatus === 'success'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : payment.paymentStatus === 'pending'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {payment.paymentStatus === 'success'
                                ? 'Амжилттай'
                                : payment.paymentStatus === 'pending'
                                  ? 'Хүлээгдэж байна'
                                  : 'Амжилтгүй'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h3 className="font-bold text-slate-200 text-base">Үйлчилгээ сунгах / Идэвхжүүлэх</h3>

            {paymentSuccess ? (
              <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-xl text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-100">Төлбөр амжилттай баталгаажлаа!</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Сунгалт амжилттай хийгдлээ. Хянах самбараас ширээний төлөвөө шалгана уу.
                </p>
                <button
                  onClick={() => setPaymentSuccess(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all"
                >
                  Хаах
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Багц сонгох</label>
                  <select
                    onChange={(e) => {
                      const plan = plans.find((item) => item.name === e.target.value);
                      setSelectedPlan(plan || null);
                      setInvoice(null);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Багц сонгох...</option>
                    {plans.map((plan) => (
                      <option key={plan.name} value={plan.name}>{plan.description}</option>
                    ))}
                  </select>
                </div>

                {selectedPlan && (
                  <>
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold mb-2">Төлбөрийн хэлбэр</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('stripe'); setInvoice(null); }}
                          className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                            paymentMethod === 'stripe'
                              ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="font-bold text-[9px] uppercase tracking-wider">Stripe</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('qpay'); setInvoice(null); }}
                          className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                            paymentMethod === 'qpay'
                              ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <QrCode className="w-5 h-5" />
                          <span className="font-bold text-[9px] uppercase tracking-wider">QPay</span>
                        </button>
                      </div>
                    </div>

                    {invoice && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center space-y-3">
                        {invoice.message && (
                          <p className="text-[11px] leading-relaxed text-center text-amber-300">
                            {invoice.message}
                          </p>
                        )}
                        <div className="p-2 bg-white rounded-xl">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(invoice.qrText)}`}
                            alt="QPay QR"
                            className="w-28 h-28"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleMockQpaySuccess}
                          className="w-full py-2 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-lg text-xs"
                          disabled={submitting}
                        >
                          {submitting ? 'Хүлээж байна...' : 'QR төлбөр баталгаажуулах'}
                        </button>
                      </div>
                    )}

                    {!invoice && (
                      <>
                        {paymentMethod === 'stripe' && (
                          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-400">
                            <p className="font-bold text-amber-400">Stripe test card</p>
                            <p className="mt-1">Card: <span className="font-mono text-slate-200">4242 4242 4242 4242</span></p>
                            <p>Date: ирээдүйн сар/жил, CVC: дурын 3 тоо</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handlePay}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex justify-center items-center gap-2"
                          disabled={submitting || !paymentMethod}
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              Багц сунгах
                              <ExternalLink className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
