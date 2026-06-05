import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GripVertical, ImageUp, Save, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Row = { key: string; value: unknown };
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type GalleryImage = { url: string; alt: string };

const STORAGE_IMAGE_PREFIX = "storage:site-images/";

const SECTION_DOCS: Record<string, string> = {
  hero: "Hero banner: headline, subtitle, CTAs, hero image, available-slots image.",
  about: "About section: eyebrow, two-line heading, two paragraphs, founded label.",
  stats: "Stats counters under About. Array of { n, s, l }.",
  features: 'Why-Pit-Glam grid. Array of { icon, title, desc }.',
  reviews: "Testimonials. Array of { name, role, quote, image_url }.",
  gallery: "Before/after + gallery images. Drag tiles below to reorder.",
  service_images: "Service card images. Keys: brows, lashes, bridal, default.",
  faqs: "FAQ accordion. Array of { q, a }.",
  contact: "WhatsApp, phone, email, Instagram, address, hours.",
};

const SECTION_ORDER = ["hero", "about", "stats", "features", "reviews", "gallery", "service_images", "faqs", "contact"];
const DEFAULT_ROWS: Record<string, JsonValue> = {
  gallery: { before_image_url: "", after_image_url: "", images: [] },
  service_images: { brows: "", lashes: "", bridal: "", default: "" },
};

function safeName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
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

// Convert storage references to signed URLs (just for admin previews)
async function toPreviewUrl(value: string): Promise<string> {
  if (!value || !value.startsWith(STORAGE_IMAGE_PREFIX)) return value;
  const path = value.slice(STORAGE_IMAGE_PREFIX.length);
  const { data } = await supabase.storage.from("site-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
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
      gallery: parse("gallery") as { before_image_url?: string; after_image_url?: string; images?: GalleryImage[] },
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
      .channel(`site-settings-admin-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
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
      const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
      const storagePath = `site-content/${key}/${safeName(compressed)}`;
      const { error: uploadError } = await supabase.storage
        .from("site-images")
        .upload(storagePath, compressed, { contentType: compressed.type, upsert: false });
      if (uploadError) throw uploadError;
      const current = parseSection(rows, key);
      const updated = setAtPath(current, path, `storage:site-images/${storagePath}`);
      await saveValue(key, updated);
      const ratio = file.size > 0 ? Math.round((1 - compressed.size / file.size) * 100) : 0;
      if (ratio > 5) toast.info(`Image optimized · ${ratio}% smaller`);
    } catch (err) {
      toast.error("Image upload failed", { description: (err as Error).message });
    } finally {
      setUploading(null);
    }
  };

  // Gallery operations
  const galleryImages: GalleryImage[] = Array.isArray(parsed.gallery.images) ? parsed.gallery.images : [];

  const saveGallery = async (next: GalleryImage[]) => {
    const current = parseSection(rows, "gallery") as Record<string, JsonValue>;
    await saveValue("gallery", { ...current, images: next as unknown as JsonValue });
  };

  const addGalleryImage = async (file?: File) => {
    if (!file) return;
    setUploading("gallery.images.add");
    try {
      const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
      const storagePath = `site-content/gallery/${safeName(compressed)}`;
      const { error } = await supabase.storage
        .from("site-images")
        .upload(storagePath, compressed, { contentType: compressed.type, upsert: false });
      if (error) throw error;
      const next = [...galleryImages, { url: `storage:site-images/${storagePath}`, alt: "Gallery image" }];
      await saveGallery(next);
    } catch (err) {
      toast.error("Image upload failed", { description: (err as Error).message });
    } finally {
      setUploading(null);
    }
  };

  const removeGalleryImage = async (idx: number) => {
    if (!confirm("Remove this gallery image?")) return;
    const next = galleryImages.filter((_, i) => i !== idx);
    await saveGallery(next);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    const next = arrayMove(galleryImages, oldIndex, newIndex);
    await saveGallery(next);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading site content…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
        Edit landing-page copy and images. Uploads are auto-compressed (WebP, max 1600px) for faster Lighthouse scores. Drag gallery tiles to reorder.
      </div>

      <Card>
        <CardHeader><CardTitle>Image uploads</CardTitle></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <UploadField label="Hero background" id="hero-image" busy={uploading === "hero.image_url"} onFile={(file) => uploadImage("hero", ["image_url"], file)} />
          <UploadField label="Available slots badge" id="hero-slots" busy={uploading === "hero.slots_image_url"} onFile={(file) => uploadImage("hero", ["slots_image_url"], file)} />
          <UploadField label="Brow service card" id="service-brows" busy={uploading === "service_images.brows"} onFile={(file) => uploadImage("service_images", ["brows"], file)} />
          <UploadField label="Lash service card" id="service-lashes" busy={uploading === "service_images.lashes"} onFile={(file) => uploadImage("service_images", ["lashes"], file)} />
          <UploadField label="Bridal service card" id="service-bridal" busy={uploading === "service_images.bridal"} onFile={(file) => uploadImage("service_images", ["bridal"], file)} />
          <UploadField label="Default service card" id="service-default" busy={uploading === "service_images.default"} onFile={(file) => uploadImage("service_images", ["default"], file)} />
          <UploadField label="Before image" id="gallery-before" busy={uploading === "gallery.before_image_url"} onFile={(file) => uploadImage("gallery", ["before_image_url"], file)} />
          <UploadField label="After image" id="gallery-after" busy={uploading === "gallery.after_image_url"} onFile={(file) => uploadImage("gallery", ["after_image_url"], file)} />
          {parsed.reviews.map((review, idx) => (
            <UploadField key={idx} label={`Review · ${String(review.name ?? `#${idx + 1}`)}`} id={`review-${idx}`} busy={uploading === `reviews.${idx}.image_url`} onFile={(file) => uploadImage("reviews", [idx, "image_url"], file)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Gallery — drag to reorder</span>
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent">
              <ImageUp className="h-4 w-4" />
              {uploading === "gallery.images.add" ? "Uploading…" : "Add image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => addGalleryImage(e.target.files?.[0])}
                disabled={uploading === "gallery.images.add"}
              />
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {galleryImages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gallery images yet. Use the button above to add some.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={galleryImages.map((_, i) => String(i))} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {galleryImages.map((img, idx) => (
                    <SortableTile
                      key={`${idx}-${img.url}`}
                      id={String(idx)}
                      image={img}
                      onRemove={() => removeGalleryImage(idx)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
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
      {busy && <p className="mt-2 text-xs text-muted-foreground">Optimizing & uploading…</p>}
    </div>
  );
}

function SortableTile({ id, image, onRemove }: { id: string; image: GalleryImage; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [preview, setPreview] = useState<string>("");
  useEffect(() => {
    let alive = true;
    toPreviewUrl(image.url).then((u) => { if (alive) setPreview(u); });
    return () => { alive = false; };
  }, [image.url]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
    >
      {preview ? (
        <img src={preview} alt={image.alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Loading…</div>
      )}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 inline-flex items-center justify-center h-8 w-8 rounded-md bg-background/80 backdrop-blur cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 inline-flex items-center justify-center h-8 w-8 rounded-md bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
