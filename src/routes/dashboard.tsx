import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, addDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, CalendarDays, Scissors, Users, MessageCircle, ShieldCheck } from "lucide-react";

/* ---------- WhatsApp helper ---------- */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}
function buildWhatsAppMessage(opts: {
  clientName: string; serviceName?: string | null; startAt: string; durationMin: number; priceKes: number; isUpdate: boolean;
}) {
  const d = new Date(opts.startAt);
  const when = d.toLocaleString("en-KE", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const verb = opts.isUpdate ? "updated" : "confirmed";
  return [
    `Hi ${opts.clientName} ✨`,
    ``,
    `Your Pit Glam appointment is ${verb}:`,
    `• ${opts.serviceName ?? "Service"}`,
    `• ${when}`,
    `• ${opts.durationMin} min · KSh ${opts.priceKes.toLocaleString()}`,
    ``,
    `See you soon — Pit Glam Studio, Nairobi.`,
    `Because your Brows & Lashes Matter 💛`,
  ].join("\n");
}
function openWhatsApp(phone: string, message: string) {
  const p = normalizePhone(phone);
  if (!p) return false;
  const url = `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Staff Dashboard — Pit Glam" }] }),
  component: DashboardPage,
});

type Service = {
  id: string; name: string; description: string | null; category: string | null;
  price_kes: number; duration_min: number; active: boolean; sort_order: number;
};
type Booking = {
  id: string; client_name: string; client_phone: string | null;
  service_id: string | null; employee_id: string | null;
  start_at: string; duration_min: number; price_kes: number;
  status: string; notes: string | null;
};
type StaffMember = { id: string; display_name: string | null; role: "admin" | "employee" | null };

function DashboardPage() {
  const { user, isAdmin, isStaff, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!isStaff) {
    return <AwaitingRole />;
  }


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl">
            <span>Pit</span><span className="text-gradient-gold"> Glam</span>
            <span className="ml-3 text-xs hairline text-muted-foreground">STAFF</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {user.email} · <span className="uppercase tracking-wider text-xs">{isAdmin ? "Admin" : "Employee"}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings"><CalendarDays className="h-4 w-4 mr-1" />Bookings</TabsTrigger>
            <TabsTrigger value="services"><Scissors className="h-4 w-4 mr-1" />Services</TabsTrigger>
            {isAdmin && <TabsTrigger value="team"><Users className="h-4 w-4 mr-1" />Team</TabsTrigger>}
          </TabsList>

          <TabsContent value="bookings" className="mt-6"><BookingsTab /></TabsContent>
          <TabsContent value="services" className="mt-6"><ServicesTab isAdmin={isAdmin} /></TabsContent>
          {isAdmin && <TabsContent value="team" className="mt-6"><TeamTab /></TabsContent>}
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Bookings ---------- */
function BookingsTab() {
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const from = startOfDay(date).toISOString();
    const to = addDays(startOfDay(date), 1).toISOString();
    const [b, s, p, r] = await Promise.all([
      supabase.from("bookings").select("*").gte("start_at", from).lt("start_at", to).order("start_at"),
      supabase.from("services").select("*").order("sort_order"),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (b.data) setBookings(b.data as Booking[]);
    if (s.data) setServices(s.data as Service[]);
    if (p.data && r.data) {
      const roleMap = new Map<string, "admin" | "employee">();
      (r.data as any[]).forEach((x) => {
        const cur = roleMap.get(x.user_id);
        if (x.role === "admin" || !cur) roleMap.set(x.user_id, x.role);
      });
      setStaff((p.data as any[]).map((u) => ({
        id: u.id, display_name: u.display_name, role: roleMap.get(u.id) ?? null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [date]);

  const dayBookings = bookings;

  const remove = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-8">
      <Card>
        <CardHeader><CardTitle className="text-lg">Calendar</CardTitle></CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(startOfDay(d))}
            className="p-0 pointer-events-auto"
          />
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl">{format(date, "EEEE, d MMMM yyyy")}</h2>
            <p className="text-sm text-muted-foreground">{dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"}</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" />New Booking</Button>
            </DialogTrigger>
            <BookingDialog
              editing={editing}
              services={services}
              staff={staff.filter((s) => s.role)}
              defaultDate={date}
              onSaved={() => { setOpen(false); setEditing(null); load(); }}
            />
          </Dialog>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : dayBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            No bookings for this day. Click <span className="font-medium">New Booking</span> to add one.
          </div>
        ) : (
          <div className="space-y-3">
            {dayBookings.map((b) => {
              const svc = services.find((s) => s.id === b.service_id);
              const emp = staff.find((s) => s.id === b.employee_id);
              return (
                <Card key={b.id}>
                  <CardContent className="p-5 flex flex-wrap items-center gap-4">
                    <div className="text-center min-w-[72px]">
                      <div className="font-display text-2xl">{format(new Date(b.start_at), "HH:mm")}</div>
                      <div className="text-xs text-muted-foreground">{b.duration_min} min</div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium">{b.client_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {svc?.name ?? "—"} · {emp?.display_name ?? "Unassigned"}
                      </div>
                      {b.client_phone && <div className="text-xs text-muted-foreground">{b.client_phone}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">KSh {b.price_kes.toLocaleString()}</div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{b.status}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingDialog({
  editing, services, staff, defaultDate, onSaved,
}: {
  editing: Booking | null;
  services: Service[];
  staff: StaffMember[];
  defaultDate: Date;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => initForm(editing, defaultDate, services));
  useEffect(() => { setForm(initForm(editing, defaultDate, services)); }, [editing, defaultDate, services]);

  function initForm(b: Booking | null, d: Date, svcs: Service[]) {
    const base = b ? new Date(b.start_at) : new Date(d.setHours(10, 0, 0, 0));
    return {
      client_name: b?.client_name ?? "",
      client_phone: b?.client_phone ?? "",
      service_id: b?.service_id ?? svcs[0]?.id ?? "",
      employee_id: b?.employee_id ?? "",
      date: format(base, "yyyy-MM-dd"),
      time: format(base, "HH:mm"),
      duration_min: b?.duration_min ?? svcs[0]?.duration_min ?? 60,
      price_kes: b?.price_kes ?? svcs[0]?.price_kes ?? 0,
      status: b?.status ?? "scheduled",
      notes: b?.notes ?? "",
    };
  }

  const onServiceChange = (id: string) => {
    const s = services.find((x) => x.id === id);
    setForm((f) => ({ ...f, service_id: id, duration_min: s?.duration_min ?? f.duration_min, price_kes: s?.price_kes ?? f.price_kes }));
  };

  const save = async () => {
    if (!form.client_name.trim()) return toast.error("Client name required");
    const start_at = new Date(`${form.date}T${form.time}`).toISOString();
    const payload = {
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim() || null,
      service_id: form.service_id || null,
      employee_id: form.employee_id || null,
      start_at,
      duration_min: Number(form.duration_min),
      price_kes: Number(form.price_kes),
      status: form.status,
      notes: form.notes.trim() || null,
    };
    const res = editing
      ? await supabase.from("bookings").update(payload).eq("id", editing.id)
      : await supabase.from("bookings").insert({ ...payload, created_by: user!.id });
    if (res.error) {
      const msg = /overlap/i.test(res.error.message)
        ? "⚠️ This employee already has a booking that overlaps this time slot."
        : res.error.message;
      return toast.error(msg);
    }
    toast.success(editing ? "Updated" : "Booking created");

    // WhatsApp reminder
    if (payload.client_phone) {
      const svc = services.find((s) => s.id === payload.service_id);
      const opened = openWhatsApp(
        payload.client_phone,
        buildWhatsAppMessage({
          clientName: payload.client_name,
          serviceName: svc?.name,
          startAt: payload.start_at,
          durationMin: payload.duration_min,
          priceKes: payload.price_kes,
          isUpdate: !!editing,
        }),
      );
      if (opened) toast.info("WhatsApp reminder opened — press send.");
    }
    onSaved();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? "Edit booking" : "New booking"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Client name</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} /></div>
        </div>
        <div>
          <Label>Service</Label>
          <Select value={form.service_id} onValueChange={onServiceChange}>
            <SelectTrigger><SelectValue placeholder="Choose service" /></SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} — KSh {s.price_kes.toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Assigned to</Label>
          <Select value={form.employee_id || "_none"} onValueChange={(v) => setForm({ ...form, employee_id: v === "_none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Unassigned</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.display_name || "(no name)"} · {s.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
          <div><Label>Duration (min)</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Price (KSh)</Label><Input type="number" value={form.price_kes} onChange={(e) => setForm({ ...form, price_kes: Number(e.target.value) })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No-show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={save}>{editing ? "Save changes" : "Create booking"}</Button></DialogFooter>
    </DialogContent>
  );
}

/* ---------- Services ---------- */
function ServicesTab({ isAdmin }: { isAdmin: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    if (data) setServices(data as Service[]);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const toggleActive = async (s: Service) => {
    const { error } = await supabase.from("services").update({ active: !s.active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl">Services & pricing</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "These prices show on the public homepage." : "Read-only — only admins can edit."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" />Add service</Button>
            </DialogTrigger>
            <ServiceDialog editing={editing} onSaved={() => { setOpen(false); setEditing(null); load(); }} />
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s) => (
          <Card key={s.id} className={s.active ? "" : "opacity-60"}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-display text-xl">{s.name}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.category || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">KSh {s.price_kes.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{s.duration_min} min</div>
                </div>
              </div>
              {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
              {isAdmin && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} />
                    {s.active ? "Active" : "Hidden"}
                  </label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ServiceDialog({ editing, onSaved }: { editing: Service | null; onSaved: () => void }) {
  const [form, setForm] = useState(() => ({
    name: editing?.name ?? "",
    category: editing?.category ?? "",
    description: editing?.description ?? "",
    price_kes: editing?.price_kes ?? 0,
    duration_min: editing?.duration_min ?? 60,
    sort_order: editing?.sort_order ?? 0,
    active: editing?.active ?? true,
  }));
  useEffect(() => {
    setForm({
      name: editing?.name ?? "",
      category: editing?.category ?? "",
      description: editing?.description ?? "",
      price_kes: editing?.price_kes ?? 0,
      duration_min: editing?.duration_min ?? 60,
      sort_order: editing?.sort_order ?? 0,
      active: editing?.active ?? true,
    });
  }, [editing]);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const payload = { ...form, name: form.name.trim(), category: form.category.trim() || null, description: form.description.trim() || null };
    const res = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Updated" : "Service added");
    onSaved();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Brows, Lashes, Bridal…" /></div>
          <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
        </div>
        <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Price (KSh)</Label><Input type="number" value={form.price_kes} onChange={(e) => setForm({ ...form, price_kes: Number(e.target.value) })} /></div>
          <div><Label>Duration (min)</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Visible on public site
        </label>
      </div>
      <DialogFooter><Button onClick={save}>{editing ? "Save changes" : "Create"}</Button></DialogFooter>
    </DialogContent>
  );
}

/* ---------- Team ---------- */
function TeamTab() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id, display_name").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (p.data && r.data) {
      const roleMap = new Map<string, "admin" | "employee">();
      (r.data as any[]).forEach((x) => {
        const cur = roleMap.get(x.user_id);
        if (x.role === "admin" || !cur) roleMap.set(x.user_id, x.role);
      });
      setMembers((p.data as any[]).map((u) => ({
        id: u.id, display_name: u.display_name, role: roleMap.get(u.id) ?? null,
      })));
    }
  };
  useEffect(() => { load(); }, []);

  const setRole = async (uid: string, role: "admin" | "employee" | null) => {
    await supabase.from("user_roles").delete().eq("user_id", uid);
    if (role) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    load();
  };

  return (
    <div>
      <h2 className="font-display text-2xl mb-1">Team & roles</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Anyone who signs up at <span className="font-mono">/login</span> appears here. Promote them to employee or admin.
      </p>
      <Card>
        <CardContent className="p-0 divide-y">
          {members.length === 0 && <div className="p-6 text-muted-foreground">No members yet.</div>}
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex-1 min-w-[180px]">
                <div className="font-medium">{m.display_name || "(no name)"}</div>
                <div className="text-xs font-mono text-muted-foreground break-all">{m.id}</div>
              </div>
              <Select value={m.role ?? "_none"} onValueChange={(v) => setRole(m.id, v === "_none" ? null : (v as any))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No access</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
