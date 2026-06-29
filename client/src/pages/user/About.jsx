import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Handshake,
  Star,
  TicketCheck,
  UtensilsCrossed,
} from 'lucide-react';
import UserLayout from '../../components/UserLayout';

const images = {
  hero:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD95o5iGbMgjz6kiDsohnPwuAYogGiu1nOLK0rb1Qv8Yb2-u9P2fwfmBitUmUKBaqOhJw8hKFU6wJcHn4GKkvXer5eZVz6P_4E5t6vSqOExVjrfCgfAmaH7Kq3DKSD9gChai-zokmOc5BRXMYN5k4Ej852hweAN389Qx_VMKlL6c7ax4-0aBXXy-bCa3lBaU1vO9NGLa0ml_rsA_z0GL_NKuN5ijAkejMTokmy5_RWA4tmItwKiBb3FZXonYOd-XkekSDd7ANvcnKIS',
  network: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA6HgjYGcGhc2lYM-tmW1c6JdNx62x-fvOLdJ4Ecfvpu1GI9ZISPw0qxRkh7V2qKN-QElsvuq5TN1cg9j4NEh9dWNvgE37U1t8ZUsTkB9kIIUIbGmjLhsmVGsf9regEiwXAIw3gqBNjYfAtc52nJApO4wW_rTgJMmdWECQzj8qWDzJcEK2eGFdGEWq8GuDeS4j3dixOHOuwIV0Xn31NhMdogKCDUnQa-oGJFOfSdqap1sliG-BVxu2WztAa2Mg5jVyH8K1RjuSqa42j',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAaGh7onnOLZ1PKVzRGNFbvVMDOXjKUl1jGVqj0GCMvIMZ7XieG_UsNdSTxaue9K7ZaeHbx0cpkM-nvnuc8q7r1w_UoGAUmW5vZOU5akFAEmQYnL506BlvL0AbPpIqpWsQa5AsUFUvnZ6TjIEUUcNutR_VGi8zCd1QTNPeKIHkDSVJQYuanfL-D57MSM_GCJ8CA1Y7dAoOlsilkDkQR8GUsowmgvrE5vtxlhaT2x2V3cBr02D6XcM3Sqf0Cgn9ND32pAOG6RDdiMCI6',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6swWjhB87Yo0Bp0_kykNylMq7NFJCRqgZ8OTnolCL0j3LUdZVUJkl0s_rWkHr1cT2zIRTUwRzUS5rgPw1WZtaEpfTMTti1ClPy5976r-wphEZXLx9DSRsTjq0uz7jXJzBBLhXHKkKUivtINOPQaNYZ6F_isIvGTXrSSJxTSy3RW7YM1AXepfzgbLSNKPfU_WvobhmVdabmCR53vfaS6itOdX1Uvyh5rYBld86Fv5cIRZLwZvozAXHiBD7aikKAVoP0oLp4L8gSEJA',
  ],
  business:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBMfyRXAwmGGqfCc59lR-EIz1daZKSvKMoa33LU8bw83M8mM_-rCjvrzySHgrVbPca3dM2b4eWwK5wemzm49ZhlBA5WtxSXCQK5_Pc-w-liZOtQMY7KPzKNYc0CRjg4O0T694TSmKWaeU7sAbXxUn60kR0EdzWRyHLmJ1hbZntb52ZiC4XIz2eXgxYCD5rNyKyqKk7zAxRurHk6bdc1dzi0KNzCh26NnFQdszySQ9SK0r3xDhIpnZytG5KOk9OKIyWFs5WBpJDZbokV',
};

const advantages = [
  {
    icon: UtensilsCrossed,
    title: 'Онцгой сонголт',
    text: 'Бид зөвхөн шалгуур хангасан, дээд зэрэглэлийн зоогийн газруудыг сүлжээндээ нэгтгэдэг.',
    className: 'md:col-span-7 bg-[#1d1b17]',
  },
  {
    icon: BarChart3,
    title: 'Үр ашигтай маркетинг',
    text: 'Ресторан эзэмшигчдэд зорилтот хэрэглэгчдэдээ шууд хүрэх хамгийн дөт замыг санал болгодог.',
    className: 'md:col-span-5 bg-[#2c2a25]',
  },
  {
    icon: TicketCheck,
    title: 'Түргэн захиалга',
    text: 'Хэдхэн товшилтоор хамгийн тухтай ширээг өөрийн болгох боломж.',
    className: 'md:col-span-4 bg-[#2c2a25]',
  },
  {
    icon: Handshake,
    title: 'Түншлэлийн давуу тал',
    text: 'Бидний хамтын ажиллагаа таны бизнесийг шинэ шатанд гаргах болно.',
    className: 'md:col-span-8 bg-[#1d1b17]',
  },
];

const venues = [
  { title: 'The Grand Reserve', tag: 'Fine Dining', place: 'Central Tower, 17th Floor' },
  { title: 'Silk Road Pavilion', tag: 'Modern Lounge', place: 'Shangri-La Mall' },
  { title: 'Aura Lounge', tag: 'Exclusive Bar', place: 'Blue Sky Tower' },
];

export default function About() {
  return (
    <UserLayout>
      <main className="bg-[#15130f] text-[#e8e1db]">
        <section className="relative flex min-h-[86vh] items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={images.hero} alt="Luxury restaurant interior" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/65" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-8">
              <span className="inline-block border border-[#f2ca50]/40 px-4 py-1 text-sm font-bold uppercase tracking-[0.22em] text-[#f2ca50]">
                Premium Dining
              </span>
              <h1 className="text-5xl font-extrabold leading-tight text-[#e8e1db] sm:text-7xl">
                Luxury Dining Network
              </h1>
              <p className="text-lg leading-8 text-[#d0c5af]">
                Улаанбаатар хотын хамгийн шилдэг, тансаг зэрэглэлийн зоогийн газруудын нэгдсэн сүлжээ. Дээд зэрэглэлийн амт,
                үйлчилгээ, орчныг UBTable-ээр дамжуулан мэдэр.
              </p>
              <Link
                to="/restaurants-lounges"
                className="inline-flex rounded-sm bg-[#f2ca50] px-10 py-4 text-2xl font-semibold text-[#3c2f00] transition hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                Join Our Network
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-4 py-28 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-[#f2ca50]">Why UBTable?</h2>
            <div className="mx-auto h-1 w-24 bg-[#f2ca50]" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {advantages.map(({ icon: Icon, title, text, className }) => (
              <div key={title} className={`group relative overflow-hidden border border-[#3d372e] p-10 transition hover:border-[#d4af37] ${className}`}>
                <div className="relative z-10 space-y-4">
                  <Icon className="h-10 w-10 text-[#f2ca50]" />
                  <h3 className="text-2xl font-semibold text-[#e8e1db]">{title}</h3>
                  <p className="leading-7 text-[#d0c5af]">{text}</p>
                </div>
                <Star className="absolute -bottom-10 -right-10 h-48 w-48 fill-current text-white/5 transition group-hover:text-white/10" />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#100e0a] py-28">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-xl">
                <h2 className="text-5xl font-extrabold text-[#f2ca50]">Our Network</h2>
                <p className="mt-4 text-lg leading-8 text-[#d0c5af]">
                  Улаанбаатар хотын хамгийн тав тухтай, тансаг орчинтой зоогийн газруудтай бид түншлэн ажилладаг.
                </p>
              </div>
              <Link to="/restaurants-lounges" className="group inline-flex items-center gap-2 font-bold text-[#f2ca50]">
                Бүгдийг харах <ArrowRight className="h-5 w-5 transition group-hover:translate-x-2" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {venues.map((venue, index) => (
                <div key={venue.title} className="group relative aspect-[3/4] overflow-hidden border border-[#3d372e] transition hover:border-[#d4af37]">
                  <img
                    src={images.network[index]}
                    alt={venue.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8">
                    <span className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-[#f2ca50]">{venue.tag}</span>
                    <h4 className="text-2xl font-semibold text-white">{venue.title}</h4>
                    <p className="mt-2 text-sm text-[#d0c5af] opacity-0 transition-opacity group-hover:opacity-100">{venue.place}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-28">
          <div className="absolute inset-0 -z-10 origin-right translate-y-20 skew-y-3 bg-[#2c2a25]/40" />
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-16 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            <div className="relative order-2 md:order-1">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#f2ca50]/10 blur-3xl" />
              <img src={images.business} alt="Business partnership" className="relative z-10 w-full border border-[#3d372e] object-cover shadow-2xl" />
              <div className="absolute -bottom-6 -right-6 hidden bg-[#f2ca50] p-6 font-bold text-[#3c2f00] lg:block">
                <p className="text-2xl">200+</p>
                <p className="text-xs uppercase tracking-widest">Active Partners</p>
              </div>
            </div>

            <div className="order-1 space-y-8 md:order-2">
              <h2 className="text-5xl font-extrabold leading-tight text-[#e8e1db]">For Business Owners</h2>
              <p className="text-lg leading-8 text-[#d0c5af]">
                Зоогийн газрынхаа үнэ цэнийг нэмэгдүүлж, зорилтот хэрэглэгчдэдээ илүү ойртоорой. UBTable-ийн түнш болсноор
                та өөрийн рестораныг олон улсын жишигт нийцсэн маркетингийн сувагтай болгоно.
              </p>
              <ul className="space-y-4">
                {['Борлуулалтын шинэ суваг', 'Хэрэглэгчийн үнэнч байдлын хөтөлбөр', 'Дижитал захиалгын уян хатан систем'].map((item) => (
                  <li key={item} className="flex items-center gap-4 text-[#e8e1db]">
                    <CheckCircle2 className="h-5 w-5 text-[#f2ca50]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="inline-flex border border-[#f2ca50] px-8 py-3 font-bold text-[#f2ca50] transition hover:bg-[#f2ca50]/10"
              >
                Хамтран ажиллах хүсэлт илгээх
              </Link>
            </div>
          </div>
        </section>
      </main>
    </UserLayout>
  );
}
