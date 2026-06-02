import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/staff/me", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (mounted && data?.authenticated) {
          navigate({ to: "/staff", replace: true });
          return;
        }
      } catch {
        // no-op; show login form
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || "Authentication failed");
      }
      window.dispatchEvent(new CustomEvent("pitglam:staff-login-success", { detail: { email } }));
      navigate({ to: "/staff", replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background px-6">Checking session…</div>;
  }

  return (
    <div className="min-h-screen bg-background px-6 py-14">
      <div className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border bg-card p-6 shadow-luxe md:grid-cols-[1.05fr_0.95fr] md:p-10">
        <section className="flex flex-col justify-between rounded-[1.5rem] bg-foreground p-8 text-background md:p-10">
          <div>
            <p className="hairline text-accent">Admin access</p>
            <h1 className="mt-4 font-display text-4xl md:text-6xl leading-none">Sign in to the dashboard</h1>
            <p className="mt-5 max-w-md text-sm md:text-base text-background/70">
              Use your admin or sudo credentials to manage appointments, services, and messages.
            </p>
          </div>
          <div className="mt-10 rounded-3xl border border-background/15 bg-background/10 p-5">
            <p className="text-sm text-background/70">Need the main site?</p>
            <a href="/" className="mt-3 inline-flex rounded-full bg-background px-5 py-3 text-sm font-medium text-foreground">
              Return home
            </a>
          </div>
        </section>

        <section className="rounded-[1.5rem] border bg-background p-6 md:p-8">
          <h2 className="font-display text-3xl">Staff login</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email and password to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border bg-background px-4 py-3 outline-none ring-0 focus:border-foreground"
                placeholder="admin@pitglam.com"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border bg-background px-4 py-3 outline-none ring-0 focus:border-foreground"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            After sign in, you will be redirected to the admin dashboard automatically.
          </div>
        </section>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Pit Glam · Login" }],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});
