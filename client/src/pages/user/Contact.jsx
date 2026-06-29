import React from 'react';
import UserLayout from '../../components/UserLayout';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';

const contactCards = [
  {
    icon: Phone,
    title: 'Утас',
    value: '+976 7700 1234',
    action: 'Бидэн рүү залгаарай',
    href: 'tel:+97677001234',
  },
  {
    icon: Mail,
    title: 'И-мэйл',
    value: 'info@ublounge.mn',
    action: 'И-мэйл илгээгээрэй',
    href: 'mailto:info@ublounge.mn',
  },
  {
    icon: Clock,
    title: 'Ажиллах цаг',
    value: 'Өдөр бүр 17:00 - 02:00',
    action: 'Бид таныг хүлээж байна',
  },
  {
    icon: MapPin,
    title: 'Хаяг байршил',
    value: 'Таны одоогийн байршил 47.8721, 106.8343',
    action: 'Газрын зураг дээр харах',
    href: '/',
  },
];

export default function Contact() {
  return (
    <UserLayout>
      <section className="w-full px-0 py-0">
        <div className="w-full border-y border-lounge-border bg-lounge-card/75 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
          <div className="p-4 sm:p-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                Бидэнтэй <span className="text-gradient-neon">холбогдох</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-lounge-muted">
                Асуулт, санал, гомдолтой холбоотой бидэнтэй холбогдоорой.
                Бид тантай холбогдоход таатай байх болно.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {contactCards.map(({ icon: Icon, title, value, action, href }) => {
                const content = (
                  <div className="h-full rounded-2xl border border-lounge-border bg-lounge-black/60 p-5 transition-all hover:border-lounge-accent/60 hover:shadow-[0_0_18px_rgba(255,168,0,0.16)]">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lounge-accent/10 text-lounge-accent shadow-[0_0_18px_rgba(255,168,0,0.18)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-extrabold text-white">{title}</h3>
                    <p className="mt-2 min-h-10 text-xs leading-relaxed text-lounge-muted">{value}</p>
                    <p className="mt-5 text-xs font-bold text-lounge-accent">{action}</p>
                  </div>
                );

                return href ? (
                  <a key={title} href={href} className="block h-full">
                    {content}
                  </a>
                ) : (
                  <div key={title} className="h-full">
                    {content}
                  </div>
                );
              })}
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-lounge-border bg-lounge-black/60">
              <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="relative min-h-72 overflow-hidden p-6">
                  <div className="relative z-10 max-w-xs">
                    <h2 className="text-2xl font-black text-white">Бидэнд мессеж үлдээгээрэй</h2>
                    <p className="mt-5 text-sm leading-relaxed text-lounge-muted">
                      Доорх формыг бөглөн бидэнд мэдээллээ илгээнэ үү. Бид тантай хамгийн хурдан хугацаанд холбогдох хичээнэ.
                    </p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=80"
                    alt="Lounge table"
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-lounge-black via-lounge-black/70 to-lounge-black/25" />
                </div>

                <form
                  className="space-y-3 p-4 sm:p-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const subject = encodeURIComponent(`UBLounge холбоо барих: ${formData.get('name')}`);
                    const body = encodeURIComponent(
                      `Нэр: ${formData.get('name')}\nИ-мэйл: ${formData.get('email')}\nУтас: ${formData.get('phone')}\n\n${formData.get('message')}`
                    );
                    window.location.href = `mailto:info@ublounge.mn?subject=${subject}&body=${body}`;
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      name="name"
                      required
                      placeholder="Таны нэр"
                      className="h-12 rounded-xl border border-lounge-border bg-lounge-card px-4 text-sm text-white outline-none transition-colors placeholder:text-lounge-muted focus:border-lounge-accent"
                    />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="И-мэйл"
                      className="h-12 rounded-xl border border-lounge-border bg-lounge-card px-4 text-sm text-white outline-none transition-colors placeholder:text-lounge-muted focus:border-lounge-accent"
                    />
                  </div>
                  <input
                    name="phone"
                    placeholder="Утасны дугаар"
                    className="h-12 w-full rounded-xl border border-lounge-border bg-lounge-card px-4 text-sm text-white outline-none transition-colors placeholder:text-lounge-muted focus:border-lounge-accent"
                  />
                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder="Мэдэгдэл бичих..."
                    className="w-full resize-none rounded-xl border border-lounge-border bg-lounge-card px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-lounge-muted focus:border-lounge-accent"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-lounge-primary px-6 py-3 text-sm font-extrabold text-white shadow-[0_0_12px_rgba(255,168,0,0.22)] transition-all hover:bg-lounge-accent"
                    >
                      <Send className="h-4 w-4" />
                      Илгээх
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
