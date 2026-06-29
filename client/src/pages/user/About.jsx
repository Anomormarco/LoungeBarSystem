import React from 'react';
import { Link } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { Armchair, CalendarDays, GlassWater, MapPin, Users } from 'lucide-react';

const heroImage = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1400&q=85';
const ctaImage = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1400&q=85';

const features = [
  {
    icon: Armchair,
    title: 'Тав тухтай орчин',
    text: 'Орчин үеийн дизайнтай, тухтай, нам жим орчинд амраарай.',
  },
  {
    icon: GlassWater,
    title: 'Амттай хоол, уух зүйлс',
    text: 'Манай тогоочийн бэлтгэсэн амттай хоол, коктейль, бармены коктейль.',
  },
  {
    icon: Users,
    title: 'Чанартай үйлчилгээ',
    text: 'Манай найрсаг баг таныг халуун дулаанаар угтаж, сэтгэл ханамжтай үйлчилнэ.',
  },
  {
    icon: CalendarDays,
    title: 'Хувийн болон групп арга хэмжээ',
    text: 'Төрсөн өдөр, тэмдэглэлт ой, бизнес уулзалт зэрэг арга хэмжээнд тохиромжтой үйлчилгээ.',
  },
];

export default function About() {
  return (
    <UserLayout>
      <section className="w-full px-0 py-0">
        <div className="w-full border-y border-lounge-border bg-lounge-card/75 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
          <div className="p-4 sm:p-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                    Бидний <span className="text-gradient-neon">тухай</span>
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-lounge-muted">
                    UB Lounge бол тав тухтай орчин, чанартай үйлчилгээ, амттай хоолоор үйлчлүүлэгчдээ дээд зэргээр хүлээн авдаг lounge-bar юм.
                  </p>
                </div>

                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-lounge-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_0_12px_rgba(255,168,0,0.25)] transition-all hover:bg-lounge-accent"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Байршил харах
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-lounge-border bg-lounge-black shadow-[0_0_28px_rgba(0,0,0,0.45)]">
                <img
                  src={heroImage}
                  alt="UBLounge interior"
                  className="h-56 w-full object-cover sm:h-72 lg:h-[340px]"
                />
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-lounge-border bg-lounge-black/60 p-5 text-center transition-all hover:border-lounge-accent/60 hover:shadow-[0_0_18px_rgba(255,168,0,0.16)]"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lounge-accent/10 text-lounge-accent shadow-[0_0_18px_rgba(255,168,0,0.18)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-lounge-muted">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-lounge-border bg-lounge-black/60">
              <div className="grid gap-4 md:grid-cols-[1fr_0.85fr] md:items-stretch">
                <div className="p-5 sm:p-6">
                  <h2 className="text-xl font-black text-lounge-accent">UB Lounge-д тавтай морил</h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-lounge-muted">
                    Амралт, уулзалт, амт чанар нэг дор таныг хүлээж байна.
                  </p>
                  <Link
                    to="/"
                    className="mt-5 inline-flex rounded-lg bg-lounge-primary px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-lounge-accent"
                  >
                    Байршил харах
                  </Link>
                </div>
                <div className="relative min-h-40">
                  <img
                    src={ctaImage}
                    alt="Lounge drinks"
                    className="h-full min-h-40 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-lounge-black/45 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
