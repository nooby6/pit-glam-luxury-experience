import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Calendar, Clock, MapPin, Phone, Mail, Instagram,
  Menu, X, MessageCircle, Star, ShieldCheck, Award, HeartHandshake,
  Leaf, Crown, ArrowRight, ArrowUpRight, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import hero from "@/assets/hero-brows.jpg";
import { browsImg, mirrorImg, closeupImg, cardSizes, heroSizes } from "./pit-glam-images";
const portrait = browsImg;
const imgLashes = mirrorImg;
const imgBrows = browsImg;
const imgBridal = closeupImg;
const imgStudio = mirrorImg;

const WHATSAPP = "https://wa.me/254722351276";

const nav = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Gallery", href: "#gallery" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

const services = [
  { name: "Eyebrow Shaping", desc: "Precision wax & tweeze tailored to your facial architecture.", price: "KSh 1,200", time: "30 min", img: imgBrows, alt: "Client showing freshly sculpted brows with clean, defined arches", caption: "Brow mapping & shaping — tailored to your bone structure" },
  { name: "Brow Lamination", desc: "Fluffy, fashion-forward brows that stay set for weeks.", price: "KSh 3,500", time: "45 min", img: imgBrows, alt: "Close-up of laminated brows brushed upward for a full, fluffy finish", caption: "Lamination creates a feathered, editorial brow look" },
  { name: "Brow Tinting", desc: "Custom-blended tint for richer, defined arches.", price: "KSh 1,500", time: "25 min", img: imgBrows, alt: "Richly tinted brows framing the eyes with deep, even pigment", caption: "Custom-blended tint matched to your hair & skin tone" },
  { name: "Classic Lash Extensions", desc: "One-to-one application for a soft mascara finish.", price: "KSh 3,000", time: "90 min", img: imgLashes, alt: "Client admiring classic lash extensions in a hand mirror", caption: "Classic 1:1 extensions — natural length with a soft curl" },
  { name: "Hybrid Lash Extensions", desc: "A textured mix of classic and volume — effortless drama.", price: "KSh 4,500", time: "120 min", img: imgLashes, alt: "Hybrid lash set blending classic singles and volume fans", caption: "Hybrid texture — the perfect balance of natural & bold" },
  { name: "Volume Lash Extensions", desc: "Hand-crafted fans for full, fluttery intensity.", price: "KSh 6,000", time: "150 min", img: imgLashes, alt: "Full volume lash fans creating a dramatic, wide-awake gaze", caption: "Russian-volume fans — up to 600 ultra-fine lashes per eye" },
  { name: "Lash Lift", desc: "Natural-lash curl that opens the eye for up to 8 weeks.", price: "KSh 3,500", time: "60 min", img: imgLashes, alt: "Lifted natural lashes curled upward, opening the eye shape", caption: "Lash lift & tint — your own lashes, beautifully curled" },
  { name: "Lash Tint", desc: "Deep, glossy pigment for a wide-awake gaze.", price: "KSh 1,200", time: "25 min", img: imgLashes, alt: "Deeply tinted lashes catching light with a glossy black finish", caption: "Semi-permanent tint — no mascara needed for weeks" },
  { name: "Bridal Beauty Package", desc: "Lashes, brows & a glow trial for your big day.", price: "KSh 12,000", time: "Custom", img: imgBridal, alt: "Bridal lash close-up — soft, romantic volume for the wedding day", caption: "Bridal trial included — walk down the aisle with confidence" },
];

const features = [
  { icon: Award, title: "Certified Artists", desc: "Trained in Korean & Russian techniques." },
  { icon: Leaf, title: "Premium Products", desc: "Vegan, ophthalmologist-tested formulations." },
  { icon: ShieldCheck, title: "Hygienic Studio", desc: "Single-use tools & autoclave sterilization." },
  { icon: HeartHandshake, title: "Personalized Maps", desc: "Brow & lash design mapped to your features." },
  { icon: Crown, title: "Long-lasting Results", desc: "Retention up to 6 weeks with proper care." },
  { icon: MapPin, title: "Valley Arcade, Kilimani", desc: "Boutique studio in the heart of the city." },
];

const reviews = [
  { name: "Wanjiru K.", role: "Bride, Karen", quote: "I floated down the aisle. My lashes outlasted the honeymoon — Pit Glam is the only place I trust now." },
  { name: "Amara O.", role: "Content Creator", quote: "The brow mapping changed my face. Every comment on my reels is about my arches now." },
  { name: "Lulu M.", role: "Lawyer, Kilimani", quote: "Clinical-level hygiene with five-star pampering. I leave feeling like the most expensive version of myself." },
  { name: "Zara A.", role: "University Student", quote: "Affordable luxury — I save my pocket money for Pit Glam. Worth every shilling." },
];

const faqs = [
  { q: "How long do lash extensions last?", a: "With proper aftercare and a refill every 2–3 weeks, your set will stay full and beautiful indefinitely." },
  { q: "Do you offer bridal trials?", a: "Yes. Every bridal package includes a complimentary trial 2–4 weeks before your wedding date." },
  { q: "Where are you located?", a: "We're at Valley Arcade, Kilimani. Free parking on site." },
  { q: "Can I book on WhatsApp?", a: "Absolutely. Tap the floating WhatsApp button anytime and our concierge will confirm within minutes." },
];

function useReveal() {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  };
}

/* -------- Loading screen -------- */
function Loader({ done }: { done: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{ pointerEvents: done ? "none" : "auto" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl tracking-tight"
        >
          <span className="text-foreground">Pit</span>
          <span className="text-gradient-gold"> Glam</span>
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 140 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="h-px bg-gradient-gold"
        />
        <span className="hairline text-muted-foreground">Crafting your glow</span>
      </div>
    </motion.div>
  );
}

/* -------- Navigation -------- */
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <div className={`mx-auto max-w-7xl px-5 transition-all duration-500`}>
        <div
          className={`flex items-center justify-between rounded-full px-5 md:px-7 transition-all duration-500 ${
            scrolled ? "glass shadow-soft py-2.5" : "py-3"
          }`}
        >
          <a href="#top" className="font-display text-2xl md:text-3xl tracking-tight">
            Pit<span className="text-gradient-gold">Glam</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm text-foreground/80 hover:text-foreground transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all hover:after:w-full"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden md:inline-flex rounded-full bg-foreground text-background hover:bg-foreground/90">
              <a href="#book">Book Now</a>
            </Button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full glass"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-3 glass rounded-3xl p-6 shadow-luxe"
          >
            <div className="flex flex-col gap-4">
              {nav.map((n) => (
                <a
                  key={n.href}
                  onClick={() => setOpen(false)}
                  href={n.href}
                  className="text-lg font-display"
                >
                  {n.label}
                </a>
              ))}
              <Button asChild className="mt-2 rounded-full bg-foreground text-background">
                <a href="#book" onClick={() => setOpen(false)}>Book Appointment</a>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}

/* -------- Hero -------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section ref={ref} id="top" className="relative min-h-screen overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src={hero}
          alt="Close-up of luxurious brows and lashes"
          className="h-full w-full object-cover"
          width={1536}
          height={1920}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* floating accents */}
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[12%] top-[28%] hidden md:block"
      >
        <div className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-gold grid place-items-center">
              <Sparkles className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs hairline text-muted-foreground">Today</p>
              <p className="text-sm font-medium">3 slots open</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-[6%] bottom-[18%] hidden lg:block"
      >
        <div className="glass rounded-2xl p-4 shadow-soft flex items-center gap-2">
          <Star className="h-4 w-4 fill-[oklch(0.78_0.085_75)] text-[oklch(0.78_0.085_75)]" />
          <span className="text-sm font-medium">4.9 · 850+ reviews</span>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-40 pb-24 md:pt-48 md:pb-32 min-h-screen flex items-center">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hairline text-muted-foreground mb-6"
          >
            Nairobi · Kilimani · Est. 2019
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-foreground"
          >
            Because your <em className="italic text-gradient-gold not-italic md:italic">Brows &amp; Lashes</em> Matter.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 max-w-xl text-lg text-muted-foreground"
          >
            A boutique brows &amp; lashes atelier where Nairobi's tastemakers come to be sculpted, lifted, and quietly transformed.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="rounded-full h-14 px-8 bg-foreground text-background hover:bg-foreground/90 shadow-luxe">
              <a href="#book">
                Book Appointment <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8 border-foreground/20 hover:bg-foreground hover:text-background">
              <a href="#services">View Services</a>
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hairline text-muted-foreground"
      >
        Scroll
      </motion.div>
    </section>
  );
}

/* -------- Counter -------- */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const dur = 1600;
        const start = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* -------- About -------- */
function About() {
  const r = useReveal();
  return (
    <section id="about" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div {...r} className="relative">
          <div className="absolute -inset-6 bg-gradient-luxe rounded-[2.5rem] -z-10 blur-2xl opacity-60" />
          <div className="overflow-hidden rounded-[2rem] shadow-luxe">
            <img src={portrait.src} srcSet={portrait.srcSet} sizes="(min-width: 1024px) 50vw, 100vw" alt="Pit Glam founder portrait" loading="lazy" decoding="async" width={portrait.width} height={portrait.height} className="h-[640px] w-full object-cover" />
          </div>
          <div className="absolute -bottom-8 -right-4 md:-right-10 glass rounded-2xl p-5 shadow-luxe max-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-gold grid place-items-center">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="hairline text-muted-foreground">Founded</p>
                <p className="font-display text-xl">2019 · Nairobi</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div {...r}>
          <p className="hairline text-accent mb-6">About Pit Glam</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-8">
            Confidence is the<br />
            <em className="italic text-gradient-gold">finest accessory</em>.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Born in the heart of Nairobi, Pit Glam was founded on a simple belief: a perfectly sculpted brow and a lifted lash can change the way you walk into a room. From boardrooms in Kilimani to weddings on the coast, our artists craft tailored beauty for the women shaping modern Kenya.
          </p>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Every appointment is a private ritual — soft music, warm tea, and time spent making you feel exactly like yourself, only more so.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { n: 2800, s: "+", l: "Happy Clients" },
              { n: 6, s: "+", l: "Years Experience" },
              { n: 15000, s: "+", l: "Treatments" },
            ].map((s) => (
              <div key={s.l} className="border-l-2 border-accent pl-4">
                <p className="font-display text-3xl md:text-4xl">
                  <Counter to={s.n} suffix={s.s} />
                </p>
                <p className="hairline text-muted-foreground mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* -------- Services -------- */
function Services() {
  const r = useReveal();
  return (
    <section id="services" className="relative py-28 md:py-40 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div {...r}>
            <p className="hairline text-accent mb-4">The Menu</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[1] max-w-2xl">
              Signature services,<br /><em className="italic text-gradient-gold">artfully delivered</em>.
            </h2>
          </motion.div>
          <motion.p {...r} className="max-w-md text-muted-foreground">
            Every treatment is preceded by a personalized consultation — your face shape, your lifestyle, your story.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.article
              key={s.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-3xl bg-card shadow-soft hover:shadow-luxe transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={s.img.src}
                  srcSet={s.img.srcSet}
                  sizes={cardSizes}
                  alt={s.alt}
                  loading="lazy"
                  decoding="async"
                  width={s.img.width}
                  height={s.img.height}
                  className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4 text-xs text-white/90 hairline opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {s.caption}
                </span>
              </div>
              <div className="p-7">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-display text-2xl leading-tight">{s.name}</h3>
                  <span className="hairline text-accent shrink-0 pt-1">{s.price}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{s.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {s.time}
                  </span>
                  <a
                    href="#book"
                    className="inline-flex items-center gap-1 text-sm font-medium group/btn"
                  >
                    Book Now
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------- Before & After slider -------- */
function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const r = useReveal();
  return (
    <section id="gallery" className="py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div {...r} className="text-center mb-14">
          <p className="hairline text-accent mb-4">Transformations</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1]">
            Before <em className="italic text-gradient-gold">&amp;</em> After
          </h2>
        </motion.div>

        <motion.div {...r} className="relative mx-auto max-w-4xl rounded-3xl overflow-hidden shadow-luxe select-none">
          <div className="relative aspect-[16/10]">
            <img src={imgBrows.src} srcSet={imgBrows.srcSet} sizes="(min-width: 768px) 800px, 100vw" alt="Before: natural brows and lashes before any treatment" width={imgBrows.width} height={imgBrows.height} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <img src={imgLashes.src} srcSet={imgLashes.srcSet} sizes="(min-width: 768px) 800px, 100vw" alt="After: lush lashes and defined brows following Pit Glam treatments" width={imgLashes.width} height={imgLashes.height} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent shadow-gold"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-background border-2 border-accent grid place-items-center shadow-luxe">
                <div className="flex items-center gap-0.5 text-accent">
                  <span>‹</span><span>›</span>
                </div>
              </div>
            </div>
            <input
              type="range" min={0} max={100} value={pos}
              onChange={(e) => setPos(+e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              aria-label="Before/after slider"
            />
            <span className="absolute top-4 left-4 hairline bg-background/80 backdrop-blur px-3 py-1.5 rounded-full">Before</span>
            <span className="absolute top-4 right-4 hairline bg-foreground text-background px-3 py-1.5 rounded-full">After</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4 hairline">
            Drag the slider to reveal the transformation — natural state to fully styled brows & lashes
          </p>
        </motion.div>

        {/* Masonry */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { src: imgLashes, alt: "Classic lash extensions reflecting in a vanity mirror" },
            { src: imgBrows, alt: "Freshly shaped and tinted brows framing the eyes" },
            { src: imgBridal, alt: "Close-up of soft bridal volume lashes for a wedding look" },
            { src: imgStudio, alt: "Lash technician workspace with mirror and premium tools" },
            { src: imgBrows, alt: "Detailed brow mapping showing symmetrical arch design" },
            { src: imgLashes, alt: "Hybrid lash set creating a textured, wide-awake gaze" },
            { src: imgBridal, alt: "Bridal lash close-up — romantic, feathered volume" },
            { src: imgStudio, alt: "Client viewing her lash transformation in the studio mirror" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.06 }}
              className={`overflow-hidden rounded-2xl shadow-soft ${i % 3 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}
            >
              <img src={item.src} alt={item.alt} loading="lazy" className="h-full w-full object-cover hover:scale-110 transition-transform duration-1000" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------- Why Choose -------- */
function Why() {
  const r = useReveal();
  return (
    <section className="py-28 md:py-40 bg-gradient-noir text-background">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div {...r} className="max-w-2xl mb-16">
          <p className="hairline text-accent mb-4">Why Pit Glam</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1]">
            The details that <em className="italic text-gradient-gold">define luxury</em>.
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-background/10 rounded-3xl overflow-hidden">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="bg-[oklch(0.18_0.012_60)] p-8 md:p-10 hover:bg-[oklch(0.22_0.014_60)] transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-gold grid place-items-center mb-6">
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="font-display text-2xl mb-3">{f.title}</h3>
              <p className="text-background/70">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------- Reviews -------- */
function Reviews() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % reviews.length), 5500);
    return () => clearInterval(t);
  }, []);
  const r = useReveal();
  return (
    <section id="reviews" className="py-28 md:py-40">
      <div className="mx-auto max-w-5xl px-5 text-center">
        <motion.p {...r} className="hairline text-accent mb-4">Loved in Nairobi</motion.p>
        <motion.h2 {...r} className="font-display text-4xl md:text-6xl leading-[1] mb-16">
          Words from our <em className="italic text-gradient-gold">muses</em>.
        </motion.h2>
        <motion.div {...r} className="relative h-[280px] md:h-[220px]">
          {reviews.map((rev, idx) => (
            <motion.div
              key={rev.name}
              initial={false}
              animate={{ opacity: i === idx ? 1 : 0, y: i === idx ? 0 : 20 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{ pointerEvents: i === idx ? "auto" : "none" }}
            >
              <Quote className="h-10 w-10 text-accent mx-auto mb-6" />
              <p className="font-display text-2xl md:text-3xl leading-snug max-w-3xl mx-auto">
                "{rev.quote}"
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-gold grid place-items-center font-display text-sm">
                  {rev.name[0]}
                </div>
                <div className="text-left">
                  <p className="font-medium">{rev.name}</p>
                  <p className="text-xs text-muted-foreground">{rev.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div className="mt-8 flex justify-center gap-2">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Review ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-foreground" : "w-1.5 bg-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------- Booking -------- */
function Booking() {
  const r = useReveal();
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = (data.get("name") ?? "").toString();
    const phone = (data.get("phone") ?? "").toString();
    const email = (data.get("email") ?? "").toString();
    const service = (data.get("service") ?? (form.querySelector('[name="service"]') as HTMLInputElement | null)?.value ?? "").toString();
    const date = (data.get("date") ?? "").toString();
    const time = (data.get("time") ?? "").toString();
    const notes = (data.get("notes") ?? "").toString();
    const message = `Hi Pit Glam, I'd like to book an appointment.\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nService: ${service}\nDate: ${date}\nTime: ${time}\nNotes: ${notes}`;
    const url = `https://wa.me/254722351276?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast.success("Booking request opened in WhatsApp", {
      description: "You'll be redirected to WhatsApp to complete your request.",
    });
    form.reset();
  }
  return (
    <section id="book" className="py-28 md:py-40 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-2 gap-16 items-start">
        <motion.div {...r}>
          <p className="hairline text-accent mb-4">Reserve your seat</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-6">
            Book your <em className="italic text-gradient-gold">private ritual</em>.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            Share a few details and our concierge will confirm your appointment within the hour. Prefer to chat? We're a tap away on WhatsApp.
          </p>
          <div className="space-y-4">
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="flex items-center gap-4 glass rounded-2xl p-5 hover:shadow-soft transition-all">
              <div className="h-12 w-12 rounded-full bg-[#25D366] text-white grid place-items-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">WhatsApp Concierge</p>
                <p className="text-sm text-muted-foreground">Instant replies · 9am–8pm</p>
              </div>
            </a>
            <a href="tel:+254722351276" className="flex items-center gap-4 glass rounded-2xl p-5 hover:shadow-soft transition-all">
              <div className="h-12 w-12 rounded-full bg-foreground text-background grid place-items-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">+254 722 351276</p>
                <p className="text-sm text-muted-foreground">Call the studio directly</p>
              </div>
            </a>
          </div>
        </motion.div>

        <motion.form {...r} onSubmit={onSubmit} className="glass rounded-3xl p-8 md:p-10 shadow-luxe space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required className="mt-2 rounded-xl h-12 bg-background/60" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required className="mt-2 rounded-xl h-12 bg-background/60" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-2 rounded-xl h-12 bg-background/60" />
          </div>
          <div>
            <Label>Service</Label>
            <Select>
              <SelectTrigger className="mt-2 rounded-xl h-12 bg-background/60">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="date">Preferred Date</Label>
              <Input id="date" type="date" className="mt-2 rounded-xl h-12 bg-background/60" />
            </div>
            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Input id="time" type="time" className="mt-2 rounded-xl h-12 bg-background/60" />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} className="mt-2 rounded-xl bg-background/60" placeholder="Allergies, inspiration, occasion…" />
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full h-14 bg-foreground text-background hover:bg-foreground/90">
            Request Appointment <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By booking you agree to our cancellation policy. A 20% deposit secures your seat.
          </p>
        </motion.form>
      </div>
    </section>
  );
}

/* -------- Instagram -------- */
function Social() {
  const tiles = [imgLashes, imgBrows, imgBridal, imgStudio, imgLashes, imgBrows];
  const r = useReveal();
  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div {...r} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p className="hairline text-accent mb-4">@pitglam.nairobi</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[1]">
              Follow the <em className="italic text-gradient-gold">glow</em>.
            </h2>
          </div>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium">
            <Instagram className="h-4 w-4" /> Follow on Instagram <ArrowUpRight className="h-4 w-4" />
          </a>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tiles.map((src, i) => (
            <motion.a
              key={i}
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative aspect-square overflow-hidden rounded-2xl group"
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors grid place-items-center opacity-0 group-hover:opacity-100">
                <Instagram className="h-6 w-6 text-background" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------- Location + FAQ -------- */
function Location() {
  const r = useReveal();
  return (
    <section id="contact" className="py-28 md:py-40 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-2 gap-12">
        <motion.div {...r}>
          <p className="hairline text-accent mb-4">Visit Us</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-8">
            Find us in <em className="italic text-gradient-gold">Kilimani</em>.
          </h2>
          <div className="space-y-5 text-lg">
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-accent mt-1 shrink-0" />
              <div>
                <p className="font-medium">Valley Arcade, Kilimani</p>
                <p className="text-muted-foreground text-base">Valley Arcade · Kilimani, Nairobi, Kenya</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="h-5 w-5 text-accent mt-1 shrink-0" />
              <div>
                <p className="font-medium">Mon – Sat · 9am – 8pm</p>
                <p className="text-muted-foreground text-base">Sunday by appointment only</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-5 w-5 text-accent mt-1 shrink-0" />
              <a href="mailto:hello@pitglam.co.ke" className="font-medium">hello@pitglam.co.ke</a>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="font-display text-2xl mb-6">Frequently Asked</h3>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group glass rounded-2xl p-5 cursor-pointer">
                  <summary className="flex justify-between items-center font-medium list-none">
                    {f.q}
                    <span className="text-accent transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...r} className="rounded-3xl overflow-hidden shadow-luxe h-[640px]">
          <iframe
            title="Pit Glam location"
            src="https://www.google.com/maps?q=Valley+Arcade,Kilimani,Nairobi,Kenya&output=embed"
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="border-0 grayscale-[20%]"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* -------- Newsletter + Footer -------- */
function Footer() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("You're on the list", { description: "Welcome to the Pit Glam circle." });
    (e.currentTarget as HTMLFormElement).reset();
  }
  return (
    <footer className="bg-gradient-noir text-background pt-24 pb-10">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center pb-16 border-b border-background/10">
          <div>
            <h3 className="font-display text-3xl md:text-5xl leading-[1.05]">
              Join the <em className="italic text-gradient-gold">Pit Glam circle</em>.
            </h3>
            <p className="mt-4 text-background/70 max-w-md">Early access to seasonal offers, bridal slots, and behind-the-scenes from our artists.</p>
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input type="email" required placeholder="your@email.com" className="rounded-full h-14 bg-background/10 border-background/20 text-background placeholder:text-background/50 px-6" />
            <Button type="submit" className="rounded-full h-14 px-8 bg-gradient-gold text-foreground hover:opacity-90">
              Subscribe
            </Button>
          </form>
        </div>

        <div className="grid md:grid-cols-4 gap-10 py-16">
          <div className="md:col-span-2">
            <p className="font-display text-3xl">Pit<span className="text-gradient-gold">Glam</span></p>
            <p className="mt-4 italic text-background/70 max-w-sm">"Because your Brows &amp; Lashes Matter."</p>
          </div>
          <div>
            <p className="hairline text-background/60 mb-4">Explore</p>
            <ul className="space-y-2">
              {nav.map((n) => <li key={n.href}><a href={n.href} className="text-background/80 hover:text-accent">{n.label}</a></li>)}
            </ul>
          </div>
          <div>
            <p className="hairline text-background/60 mb-4">Contact</p>
            <ul className="space-y-2 text-background/80">
              <li>Valley Arcade, Kilimani</li>
              <li>Nairobi, Kenya</li>
              <li>+254 722 351276</li>
              <li className="flex gap-3 pt-2">
                <a href="https://instagram.com" aria-label="Instagram" className="h-9 w-9 grid place-items-center rounded-full bg-background/10 hover:bg-accent hover:text-foreground transition-colors"><Instagram className="h-4 w-4" /></a>
                <a href={WHATSAPP} aria-label="WhatsApp" className="h-9 w-9 grid place-items-center rounded-full bg-background/10 hover:bg-accent hover:text-foreground transition-colors"><MessageCircle className="h-4 w-4" /></a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-background/60">
          <p>© {new Date().getFullYear()} Pit Glam Studio. All rights reserved.</p>
          <p>Crafted with care in Nairobi.</p>
        </div>
      </div>
    </footer>
  );
}

/* -------- Floating WhatsApp -------- */
function FloatingWA() {
  return (
    <motion.a
      href={WHATSAPP}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 180 }}
      whileHover={{ scale: 1.08 }}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-luxe"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
      <MessageCircle className="h-6 w-6 relative" />
    </motion.a>
  );
}

/* -------- Page -------- */
export default function PitGlam() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <main className="relative bg-background text-foreground overflow-x-hidden">
      <Loader done={loaded} />
      <Nav />
      <Hero />
      <About />
      <Services />
      <BeforeAfter />
      <Why />
      <Reviews />
      <Booking />
      <Social />
      <Location />
      <Footer />
      <FloatingWA />
    </main>
  );
}
