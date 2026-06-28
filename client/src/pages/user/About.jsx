import React from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { ArrowRight, CheckCircle, Clock, MapPin, ShieldCheck, UtensilsCrossed } from 'lucide-react';

export default function About() {
  return (
    <UserLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] items-center">
          <div>
            <p className="text-lounge-accent text-sm font-black mb-3">UBLounge platform</p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Ойролцоох lounge, restaurant-аа хурдан олж ширээгээ баталгаажуулна.
            </h1>
            <p className="mt-5 max-w-2xl text-lounge-muted leading-relaxed">
              UBLounge нь хэрэглэгчдэд ойролцоох ресторан, lounge-уудыг газрын зураг дээрээс сонгож,
              сул ширээг хараад email кодоор захиалгаа баталгаажуулах боломж өгдөг систем.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/restaurants-lounges"
                className="inline-flex items-center gap-2 rounded-xl bg-lounge-primary px-5 py-3 text-sm font-black text-white hover:bg-lounge-primary/90"
              >
                Газрууд харах
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/for-owners"
                className="inline-flex items-center gap-2 rounded-xl border border-lounge-border bg-lounge-card px-5 py-3 text-sm font-black text-lounge-accent hover:border-lounge-accent/60"
              >
                Owner subscription
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-lounge-border bg-lounge-card">
            <img
              src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80"
              alt="Lounge interior"
              className="h-[360px] w-full object-cover"
            />
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: MapPin, title: 'Бодит байршил', text: 'Map дээр ойр байгаа lounge-уудыг marker-аар харуулна.' },
            { icon: Clock, title: 'Шууд захиалга', text: 'Сул ширээг сонгоод эхлэх цаг, хүний тоогоо оруулна.' },
            { icon: ShieldCheck, title: 'Email баталгаажуулалт', text: '6 оронтой код зөв байж захиалга баталгаажна.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-lounge-border bg-lounge-card p-5">
              <Icon className="mb-4 h-7 w-7 text-lounge-accent" />
              <h3 className="font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lounge-muted">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-lounge-border bg-lounge-card p-6">
          <div className="flex items-start gap-4">
            <UtensilsCrossed className="h-7 w-7 shrink-0 text-lounge-accent" />
            <div>
              <h2 className="text-xl font-black text-white">Owner талд</h2>
              <p className="mt-2 text-sm leading-relaxed text-lounge-muted">
                Байгууллага бүр ширээ, меню, ажилтан, захиалга, статистикаа dashboard-оос удирдана.
                Subscription идэвхтэй үед үйлчилгээ нь public map дээр харагдаж, хэрэглэгч захиалга өгөх боломжтой.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {['Ширээний төлөв real-time шинэчлэгдэнэ', 'Owner notification ирнэ', 'Меню зурагтай дэлгэрэнгүй харагдана', 'Stripe/QPay төлбөрийн эрхтэй'].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm font-bold text-white">
                    <CheckCircle className="h-4 w-4 text-lounge-accent" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
