import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HeroContent = {
  eyebrow: string;
  title_lead: string;
  title_accent: string;
  title_trail: string;
  subtitle: string;
  primary_cta: string;
  secondary_cta: string;
  slots_label: string;
  rating_label: string;
  image_url?: string;
  slots_image_url?: string;
};
export type AboutContent = {
  eyebrow: string;
  title_lead: string;
  title_accent: string;
  body_1: string;
  body_2: string;
  founded_label: string;
};
export type StatItem = { n: number; s: string; l: string };
export type FeatureItem = { icon: string; title: string; desc: string };
export type ReviewItem = { name: string; role: string; quote: string; image_url?: string };
export type FaqItem = { q: string; a: string };
export type GalleryImage = { url: string; alt: string };
export type GalleryContent = {
  before_image_url?: string;
  after_image_url?: string;
  images: GalleryImage[];
};
export type ServiceImagesContent = {
  brows?: string;
  lashes?: string;
  bridal?: string;
  default?: string;
};
export type ContactContent = {
  whatsapp_url: string;
  phone_display: string;
  email: string;
  instagram_url: string;
  instagram_handle: string;
  address_line_1: string;
  address_line_2: string;
  hours: string;
};

export type SiteContent = {
  hero: HeroContent;
  about: AboutContent;
  stats: StatItem[];
  features: FeatureItem[];
  reviews: ReviewItem[];
  gallery: GalleryContent;
  service_images: ServiceImagesContent;
  faqs: FaqItem[];
  contact: ContactContent;
};

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Nairobi · Kilimani · Est. 2019",
    title_lead: "Because your",
    title_accent: "Brows & Lashes",
    title_trail: "Matter.",
    subtitle:
      "A boutique brows & lashes atelier where Nairobi's tastemakers come to be sculpted, lifted, and quietly transformed.",
    primary_cta: "Book Appointment",
    secondary_cta: "View Services",
    slots_label: "3 slots open",
    rating_label: "4.9 · 850+ reviews",
  },
  about: {
    eyebrow: "About Pit Glam",
    title_lead: "Confidence is the",
    title_accent: "finest accessory",
    body_1:
      "Born in the heart of Nairobi, Pit Glam was founded on a simple belief: a perfectly sculpted brow and a lifted lash can change the way you walk into a room.",
    body_2:
      "Every appointment is a private ritual — soft music, warm tea, and time spent making you feel exactly like yourself, only more so.",
    founded_label: "2019 · Nairobi",
  },
  stats: [
    { n: 2800, s: "+", l: "Happy Clients" },
    { n: 6, s: "+", l: "Years Experience" },
    { n: 15000, s: "+", l: "Treatments" },
  ],
  features: [],
  reviews: [],
  gallery: { images: [] },
  service_images: {},
  faqs: [],
  contact: {
    whatsapp_url: "https://wa.me/254722351276",
    phone_display: "+254 722 351 276",
    email: "hello@pitglam.co.ke",
    instagram_url: "https://instagram.com/pitglam",
    instagram_handle: "@pitglam",
    address_line_1: "Valley Arcade",
    address_line_2: "Kilimani, Nairobi",
    hours: "Mon–Sat · 9am – 7pm",
  },
};

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error || !data) return;
      if (!active) return;
      const next: SiteContent = { ...DEFAULT_CONTENT };
      for (const row of data) {
        (next as unknown as Record<string, unknown>)[row.key] = row.value as unknown;
      }
      setContent(next);
    };
    load();
    const channel = supabase
      .channel(`site-settings-public-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return content;
}
