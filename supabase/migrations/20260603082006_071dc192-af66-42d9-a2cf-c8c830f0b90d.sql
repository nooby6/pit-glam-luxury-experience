
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings public read"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "admins manage site_settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_touch
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.site_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;

INSERT INTO public.site_settings (key, value) VALUES
('hero', '{
  "eyebrow": "Nairobi · Kilimani · Est. 2019",
  "title_lead": "Because your",
  "title_accent": "Brows & Lashes",
  "title_trail": "Matter.",
  "subtitle": "A boutique brows & lashes atelier where Nairobi''s tastemakers come to be sculpted, lifted, and quietly transformed.",
  "primary_cta": "Book Appointment",
  "secondary_cta": "View Services",
  "slots_label": "3 slots open",
  "rating_label": "4.9 · 850+ reviews"
}'),
('about', '{
  "eyebrow": "About Pit Glam",
  "title_lead": "Confidence is the",
  "title_accent": "finest accessory",
  "body_1": "Born in the heart of Nairobi, Pit Glam was founded on a simple belief: a perfectly sculpted brow and a lifted lash can change the way you walk into a room. From boardrooms in Kilimani to weddings on the coast, our artists craft tailored beauty for the women shaping modern Kenya.",
  "body_2": "Every appointment is a private ritual — soft music, warm tea, and time spent making you feel exactly like yourself, only more so.",
  "founded_label": "2019 · Nairobi"
}'),
('stats', '[
  {"n": 2800, "s": "+", "l": "Happy Clients"},
  {"n": 6, "s": "+", "l": "Years Experience"},
  {"n": 15000, "s": "+", "l": "Treatments"}
]'),
('features', '[
  {"icon": "Award", "title": "Certified Artists", "desc": "Trained in Korean & Russian techniques."},
  {"icon": "Leaf", "title": "Premium Products", "desc": "Vegan, ophthalmologist-tested formulations."},
  {"icon": "ShieldCheck", "title": "Hygienic Studio", "desc": "Single-use tools & autoclave sterilization."},
  {"icon": "HeartHandshake", "title": "Personalized Maps", "desc": "Brow & lash design mapped to your features."},
  {"icon": "Crown", "title": "Long-lasting Results", "desc": "Retention up to 6 weeks with proper care."},
  {"icon": "MapPin", "title": "Valley Arcade, Kilimani", "desc": "Boutique studio in the heart of the city."}
]'),
('reviews', '[
  {"name": "Wanjiru K.", "role": "Bride, Karen", "quote": "I floated down the aisle. My lashes outlasted the honeymoon — Pit Glam is the only place I trust now."},
  {"name": "Amara O.", "role": "Content Creator", "quote": "The brow mapping changed my face. Every comment on my reels is about my arches now."},
  {"name": "Lulu M.", "role": "Lawyer, Kilimani", "quote": "Clinical-level hygiene with five-star pampering. I leave feeling like the most expensive version of myself."},
  {"name": "Zara A.", "role": "University Student", "quote": "Affordable luxury — I save my pocket money for Pit Glam. Worth every shilling."}
]'),
('faqs', '[
  {"q": "How long do lash extensions last?", "a": "With proper aftercare and a refill every 2–3 weeks, your set will stay full and beautiful indefinitely."},
  {"q": "Do you offer bridal trials?", "a": "Yes. Every bridal package includes a complimentary trial 2–4 weeks before your wedding date."},
  {"q": "Where are you located?", "a": "We''re at Valley Arcade, Kilimani. Free parking on site."},
  {"q": "Can I book on WhatsApp?", "a": "Absolutely. Tap the floating WhatsApp button anytime and our concierge will confirm within minutes."}
]'),
('contact', '{
  "whatsapp_url": "https://wa.me/254722351276",
  "phone_display": "+254 722 351 276",
  "email": "hello@pitglam.co.ke",
  "instagram_url": "https://instagram.com/pitglam",
  "instagram_handle": "@pitglam",
  "address_line_1": "Valley Arcade",
  "address_line_2": "Kilimani, Nairobi",
  "hours": "Mon–Sat · 9am – 7pm"
}');
