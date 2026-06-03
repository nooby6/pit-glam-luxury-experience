import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

type Row = { key: string; value: unknown };

const SECTION_DOCS: Record<string, string> = {
  hero: "Hero banner: headline, subtitle, call-to-action buttons, floating badges.",
  about: "About section: eyebrow, two-line heading, two paragraphs, founded label.",
  stats: "Stats counters under About. Array of { n, s, l } — number, suffix, label.",
  features: 'Why-Pit-Glam grid. Array of { icon, title, desc }. Icon = lucide name (Award, Leaf, ShieldCheck, HeartHandshake, Crown, MapPin, Sparkles, Star, Clock, Phone, Mail, Instagram, MessageCircle, Quote).',
  reviews: "Testimonials carousel. Array of { name, role, quote }.",
  faqs: "FAQ accordion in contact section. Array of { q, a }.",
  contact: "Contact / footer info: WhatsApp URL, phone, email, Instagram, address, hours.",
};

const SECTION_ORDER = ["hero", "about", "stats", "features", "reviews", "faqs", "contact"];

export default function SiteContentTab() {
  const [rows, setRows] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const save = async (key: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rows[key]);
    } catch (err) {
      toast.error("Invalid JSON", { description: (err as Error).message });
      return;
    }
    setSaving(key);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: parsed as never }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    toast.success(`Saved ${key}`, { description: "Live on the landing page." });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading site content…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
        Edit any landing page section here. Changes go live on the home page in real time.
        Each section is stored as JSON; keep the existing field names. Reset by re-running the
        migration if you ever break the shape.
      </div>
      {SECTION_ORDER.filter((k) => k in rows).map((key) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="capitalize flex items-center justify-between gap-3">
              <span>{key}</span>
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
