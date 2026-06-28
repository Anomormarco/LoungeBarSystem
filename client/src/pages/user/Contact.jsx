import React from 'react';
import UserLayout from '../../components/UserLayout';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <UserLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-lounge-accent text-sm font-black mb-2">Contact</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white">Холбоо барих</h1>
            <p className="mt-4 text-sm leading-relaxed text-lounge-muted">
              Систем ашиглах, restaurant & lounge нэмүүлэх, owner эрх болон subscription-тэй холбоотой
              асуултаа доорх сувгуудаар илгээнэ үү.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: Mail, label: 'Имэйл', value: 'anomormarco@gmail.com', href: 'mailto:anomormarco@gmail.com' },
                { icon: Phone, label: 'Утас', value: '+976 94387282', href: 'tel:+97694387282' },
                { icon: MapPin, label: 'Байршил', value: 'Ulaanbaatar, Mongolia' },
              ].map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <div className="flex items-center gap-4 rounded-2xl border border-lounge-border bg-lounge-card p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lounge-primary/15 text-lounge-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-lounge-muted">{label}</p>
                      <p className="mt-1 font-black text-white">{value}</p>
                    </div>
                  </div>
                );
                return href ? (
                  <a key={label} href={href} className="block hover:opacity-90">
                    {content}
                  </a>
                ) : (
                  <div key={label}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-lounge-border bg-lounge-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lounge-primary/15 text-lounge-accent">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Мессеж илгээх</h2>
                <p className="text-sm text-lounge-muted">Одоогоор mail client нээж илгээдэг энгийн form.</p>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const subject = encodeURIComponent(`UBLounge холбоо барих: ${formData.get('name')}`);
                const body = encodeURIComponent(
                  `Нэр: ${formData.get('name')}\nИмэйл: ${formData.get('email')}\n\n${formData.get('message')}`
                );
                window.location.href = `mailto:anomormarco@gmail.com?subject=${subject}&body=${body}`;
              }}
            >
              <input
                name="name"
                required
                placeholder="Таны нэр"
                className="w-full rounded-xl border border-lounge-border bg-lounge-black px-4 py-3 text-sm text-white outline-none focus:border-lounge-accent"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Имэйл хаяг"
                className="w-full rounded-xl border border-lounge-border bg-lounge-black px-4 py-3 text-sm text-white outline-none focus:border-lounge-accent"
              />
              <textarea
                name="message"
                required
                rows={6}
                placeholder="Юуны талаар холбогдох вэ?"
                className="w-full resize-none rounded-xl border border-lounge-border bg-lounge-black px-4 py-3 text-sm text-white outline-none focus:border-lounge-accent"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-lounge-primary px-5 py-3 text-sm font-black text-white hover:bg-lounge-primary/90"
              >
                Илгээх
              </button>
            </form>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
