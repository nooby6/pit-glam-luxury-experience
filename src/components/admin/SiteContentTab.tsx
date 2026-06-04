import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ImageUp, Save } from "lucide-react";

type Row = { key: string; value: unknown };
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const SECTION_DOCS: Record<string, string> = {
  hero: "Hero banner: headline, subtitle, call-to-action buttons, floating badges, hero image, available-slots image.",
  about: "About section: eyebrow, two-line heading, two paragraphs, founded label.",
  stats: "Stats counters under About. Array of { n, s, l } — number, suffix, label.",
  features: 'Why-Pit-Glam grid. Array of { icon, title, desc }. Icon = lucide name (Award, Leaf, ShieldCheck, HeartHandshake, Crown, MapPin, Sparkles, Star, Clock, Phone, Mail, Instagram, MessageCircle, Quote).',
  reviews: "Testimonials carousel. Array of { name, role, quote, image_url }.",
  gallery: "Before/after and gallery images. Upload directly below or edit JSON.",
  service_images: "Images used on service and price cards. Keys: brows, lashes, bridal, default.",
  faqs: "FAQ accordion in contact section. Array of { q, a }.",
  contact: "Contact / footer info: WhatsApp URL, phone, email, Instagram, address, hours.",
};

const SECTION_ORDER = ["hero", "about", "stats", "features", "reviews", "gallery", "service_images", "faqs", "contact"];
const DEFAULT_ROWS: Record<string, JsonValue> = {
  gallery: { before_image_url: "", after_image_url: "", images: [] },
  service_images: { brows: "", lashes: "", bridal: "", default: "" },
};

function safeName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, "")}`;
}

function parseSection(rows: Record<string, string>, key: string): JsonValue {
  const fallback = DEFAULT_ROWS[key] ?? {};
  const raw = rows[key] || JSON.stringify(fallback);
  return JSON.parse(raw) as JsonValue;
}

function setAtPath(value: JsonValue, path: Array<string | number>, nextValue: JsonValue): JsonValue {
  if (path.length === 0) return nextValue;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(value) ? [...value] : [];
    arr[head] = setAtPath((arr[head] ?? {}) as JsonValue, rest, nextValue);
    return arr;
  }
  const obj = value && !Array.isArray(value) && typeof value === "object" ? { ...value } as Record<string, JsonValue> : {};
  obj[head] = setAtPath((obj[head] ?? {}) as JsonValue, rest, nextValue);
  return obj;
}

export default function SiteContentTab() {
  const [rows, setRows] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const parsed = useMemo(() => {
    const parse = (key: string) => {
      try { return parseSection(rows, key); } catch { return DEFAULT_ROWS[key] ?? {}; }
    };
    return {
      reviews: Array.isArray(parse("reviews")) ? parse("reviews") as Array<Record<string, JsonValue>> : [],
      gallery: parse("gallery") as Record<string, JsonValue>,
    };
  }, [rows]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) {
        toast.error("Failed to load site content", { description: error.message });
        setLoading(false);
        return;
      }
      const map: Record<string, string> = {};
      (data as Row[]).forEach((r) => {
        map[r.key] = JSON.stringify(r.value, null, 2);
      });
      Object.entries(DEFAULT_ROWS).forEach(([key, value]) => {
        if (!map[key]) map[key] = JSON.stringify(value, null, 2);
      });
      setRows(map);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("site-settings-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const saveValue = async (key: string, value: JsonValue) => {
    setSaving(key);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: value as never }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return false;
    }
    setRows((r) => ({ ...r, [key]: JSON.stringify(value, null, 2) }));
    toast.success(`Saved ${key}`, { description: "Live on the landing page." });
    return true;
  };

  const save = async (key: string) => {
    try {
      await saveValue(key, parseSection(rows, key));
    } catch (err) {
      toast.error("Invalid JSON", { description: (err as Error).message });
    }
  };

  const uploadImage = async (key: string, path: Array<string | number>, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const uploadKey = `${key}.${path.join(".")}`;
    setUploading(uploadKey);
    try {
      const storagePath = `site-content/${key}/${safeName(file)}`;
      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const current = parseSection(rows, key);
      const updated = setAtPath(current, path, `storage:site-images/${storagePath}`);
      await saveValue(key, updated);
    } catch (err) {
      toast.error("Image upload failed", { description: (err as Error).message });
    } finally {
      setUploading(null);
    }
  };

  const addGalleryImage = async (file?: File) => {
    const images = Array.isArray(parsed.gallery.images) ? parsed.gallery.images : [];
    const next = { ...parsed.gallery, images: [...images, { url: "", alt: "Gallery image" }] } as JsonValue;
    setRows((r) => ({ ...r, gallery: JSON.stringify(next, null, 2) }));
    await uploadImage("gallery", ["images", images.length, "url"], file);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading site content…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
        Edit landing page copy and upload replacement images here. Changes go live on the home page in real time.
      </div>

      <Card>
        <CardHeader><CardTitle>Image uploads</CardTitle></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <UploadField label="Hero background" id="hero-image" busy={uploading === "hero.image_url"} onFile={(file) => uploadImage("hero", ["image_url"], file)} />
          <UploadField label="Available slots badge" id="hero-slots" busy={uploading === "hero.slots_image_url"} onFile={(file) => uploadImage("hero", ["slots_image_url"], file)} />
          <UploadField label="Brow price/service card" id="service-brows" busy={uploading === "service_images.brows"} onFile={(file) => uploadImage("service_images", ["brows"], file)} />
          <UploadField label="Lash price/service card" id="service-lashes" busy={uploading === "service_images.lashes"} onFile={(file) => uploadImage("service_images", ["lashes"], file)} />
          <UploadField label="Bridal price/service card" id="service-bridal" busy={uploading === "service_images.bridal"} onFile={(file) => uploadImage("service_images", ["bridal"], file)} />
          <UploadField label="Default price/service card" id="service-default" busy={uploading === "service_images.default"} onFile={(file) => uploadImage("service_images", ["default"], file)} />
          <UploadField label="Before image" id="gallery-before" busy={uploading === "gallery.before_image_url"} onFile={(file) => uploadImage("gallery", ["before_image_url"], file)} />
          <UploadField label="After image" id="gallery-after" busy={uploading === "gallery.after_image_url"} onFile={(file) => uploadImage("gallery", ["after_image_url"], file)} />
          {parsed.reviews.map((review, idx) => (
            <UploadField key={idx} label={`Review image · ${String(review.name ?? `Review ${idx + 1}`)}`} id={`review-${idx}`} busy={uploading === `reviews.${idx}.image_url`} onFile={(file) => uploadImage("reviews", [idx, "image_url"], file)} />
          ))}
          <UploadField label="Add gallery image" id="gallery-add" busy={uploading?.startsWith("gallery.images") ?? false} onFile={addGalleryImage} />
        </CardContent>
      </Card>

      {SECTION_ORDER.filter((k) => k in rows).map((key) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="capitalize flex items-center justify-between gap-3">
              <span>{key.replace("_", " ")}</span>
              <Button size="sm" onClick={() => save(key)} disabled={saving === key}>
                <Save className="h-4 w-4 mr-1" />
                {saving === key ? "Saving…" : "Save"}
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{SECTION_DOCS[key]}</p>
          </CardHeader>
          <CardContent>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">JSON</Label>
            <Textarea
              value={rows[key] ?? ""}
              onChange={(e) => setRows((r) => ({ ...r, [key]: e.target.value }))}
              rows={Math.min(24, Math.max(6, (rows[key] ?? "").split("\n").length + 1))}
              className="mt-2 font-mono text-xs"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UploadField({ label, id, busy, onFile }: { label: string; id: string; busy: boolean; onFile: (file?: File) => void }) {
  return (
    <div className="rounded-xl border bg-background/60 p-4">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Input id={id} type="file" accept="image/*" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        <ImageUp className="h-4 w-4 text-muted-foreground" />
      </div>
      {busy && <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>}
    </div>
  );
}