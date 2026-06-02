import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type StaffSession = {
  authenticated: boolean;
  payload?: {
    email?: string;
    displayName?: string;
  };
};

const dashboardCards = [
  { label: "Appointments today", value: "12", note: "3 pending confirmations" },
  { label: "Weekly revenue", value: "KSh 84k", note: "Up 14% vs last week" },
  { label: "New clients", value: "27", note: "8 repeat bookings" },
  { label: "Rebooking rate", value: "68%", note: "Healthy retention" },
];

const quickActions = [
  { title: "View appointments", description: "Manage today’s schedule and status." },
  { title: "Edit services", description: "Update prices, durations, and menu items." },
  { title: "Review messages", description: "Check incoming client requests and notes." },
];

function StaffPage() {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<StaffSession | null>(null);

  async function fetchMe() {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/me");
      const data = await res.json().catch(() => ({}));
      setAuth(data as StaffSession);
    } catch (err) {
      setAuth({ authenticated: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
    const onLogin = () => fetchMe();
    window.addEventListener("pitglam:staff-login-success", onLogin);
    return () => window.removeEventListener("pitglam:staff-login-success", onLogin);
  }, []);

  async function logout() {
    await fetch("/api/staff/logout", { method: "POST" });
    fetchMe();
  }

  function openStaffLogin() {
    window.dispatchEvent(new CustomEvent("pitglam:open-staff-login"));
  }

  if (loading) return <div className="p-8">Checking session…</div>;
  if (!auth || !auth.authenticated)
    return (
      <div className="min-h-[70vh] bg-background px-6 py-14">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[2rem] border bg-card p-6 shadow-luxe md:p-10">
          <div className="flex flex-col gap-3">
            <p className="hairline text-accent">Staff access</p>
            <h2 className="font-display text-4xl md:text-6xl leading-none">Admin dashboard</h2>
            <p className="max-w-2xl text-sm md:text-base text-muted-foreground">
              Sign in to manage appointments, review bookings, and keep the studio running.
            </p>
          </div>

          <div className="rounded-3xl border bg-background p-6 md:p-8">
            <p className="text-sm text-muted-foreground">You are not signed in.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your admin or sudo credentials at <span className="font-medium text-foreground">/login</span>.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={openStaffLogin}
                className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Open login
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Back to site
              </a>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-[70vh] bg-background px-6 py-14">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border bg-card p-6 shadow-luxe md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <p className="hairline text-accent">Welcome back</p>
            <h2 className="font-display text-4xl md:text-6xl leading-none">Staff dashboard</h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Signed in as {auth.payload?.displayName || auth.payload?.email || "staff member"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              View site
            </a>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Sign out
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <article key={card.label} className="rounded-3xl border bg-card p-6 shadow-soft">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-3 font-display text-4xl leading-none">{card.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-[2rem] border bg-card p-6 shadow-soft md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="hairline text-accent">Quick actions</p>
                <h3 className="mt-1 font-display text-3xl">Operational tools</h3>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Live preview</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => (
                <div key={action.title} className="rounded-2xl border bg-background p-5">
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border bg-card p-6 shadow-soft md:p-8">
            <p className="hairline text-accent">Session</p>
            <h3 className="mt-1 font-display text-3xl">Signed in</h3>
            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              <p>Email: {auth.payload?.email || "unknown"}</p>
              <p>Role: Administrator</p>
              <p>Permissions: Appointments, services, messages</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={openStaffLogin}
                className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Re-authenticate
              </button>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Staff · Pit Glam" }], links: [] }),
  component: StaffPage,
});

export default Route;
