import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle,
  CreditCard,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';

const FEATURES = [
  'Ширээ, меню, ажилтан, захиалга нэг dashboard дээр удирдана.',
  'Хэрэглэгч email кодоор баталгаажуулсны дараа захиалга owner талд ирнэ.',
  'Subscription идэвхтэй үед байгууллага public map дээр харагдана.',
  'Хугацаа дуусвал үйлчилгээ түр идэвхгүй болж, сунгалтаар буцаад нээгдэнэ.',
];

export default function CompanyIntro() {
  return (
    <div className="min-h-screen bg-lounge-black text-white">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center border-b border-lounge-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lounge-yellow flex items-center justify-center font-black text-lounge-black text-lg">
            L
          </div>
          <div>
            <span className="font-bold block leading-none">UBLounge</span>
            <span className="text-[10px] text-lounge-muted uppercase tracking-widest">Owner information</span>
          </div>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.85fr] items-center">
          <div>
            <p className="text-lounge-yellow text-sm font-black mb-3">Restaurant & Lounge owners</p>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
              Байгууллагын захиалга, ширээ, менюг нэг системээр удирдана.
            </h1>
            <p className="mt-5 max-w-2xl text-lounge-muted leading-relaxed">
              UBLounge нь restaurant болон lounge эзэмшигчдэд public map дээр байгууллагаа харуулах,
              хэрэглэгчийн баталгаажсан захиалгыг авах, ширээний төлөвөө real-time удирдах боломж олгоно.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-lounge-border bg-lounge-card">
            <img
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80"
              alt="Restaurant management"
              className="h-[360px] w-full object-cover"
            />
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: 'Dashboard удирдлага', text: 'Ширээ, меню, ажилтан, захиалга, статистикаа нэг дор харна.' },
            { icon: ShieldCheck, title: 'Баталгаатай захиалга', text: 'Email OTP баталгаажсаны дараа л захиалга owner талд идэвхжинэ.' },
            { icon: UtensilsCrossed, title: 'Public танилцуулга', text: 'Зураг, меню, ширээний мэдээлэл хэрэглэгчийн талд харагдана.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-lounge-border bg-lounge-card p-5">
              <Icon className="mb-4 h-7 w-7 text-lounge-yellow" />
              <h3 className="font-black">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lounge-muted">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-lounge-border bg-lounge-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <CreditCard className="h-7 w-7 text-lounge-yellow" />
              <h2 className="text-2xl font-black">Төлбөрийн мэдээлэл</h2>
            </div>
            <p className="text-sm leading-relaxed text-lounge-muted">
              Байгууллага систем ашиглах эрхээ subscription төлбөрөөр идэвхжүүлнэ. Төлбөр төлөгдсөний дараа
              тухайн байгууллагын үйлчилгээ public талд харагдаж, owner dashboard бүрэн ажиллана.
            </p>
            <div className="mt-5 space-y-3">
              {[
                { icon: CalendarDays, text: 'Төлбөрийн эрх тодорхой хугацаанд хүчинтэй байна.' },
                { icon: CheckCircle, text: 'Эрх идэвхтэй үед захиалга, ширээ, меню, ажилтан удирдах боломжтой.' },
                { icon: Mail, text: 'Төлбөр, эрх сунгалтын мэдээллийг эзэмшигчид мэдэгдэнэ.' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl border border-lounge-border bg-lounge-black p-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-lounge-yellow" />
                  <span className="text-sm text-lounge-muted">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-lounge-border bg-lounge-card p-6">
            <h2 className="text-2xl font-black">Үндсэн боломжууд</h2>
            <div className="mt-5 grid gap-3">
              {FEATURES.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-lounge-border bg-lounge-black p-3">
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
