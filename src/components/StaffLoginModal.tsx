import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StaffLoginModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("pitglam:open-staff-login", onOpen as EventListener);
    return () => window.removeEventListener("pitglam:open-staff-login", onOpen as EventListener);
  }, []);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Placeholder: call your real staff auth endpoint here.
      // For now, simulate a network call and close modal on "success" if email contains "@".
      await new Promise((r) => setTimeout(r, 600));
      if (!email.includes("@")) throw new Error("Invalid credentials");
      setOpen(false);
      // Optionally dispatch an event for successful login
      window.dispatchEvent(new CustomEvent("pitglam:staff-login-success", { detail: { email } }));
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-luxe">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Staff login</h3>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close staff login"
            className="rounded-full p-2 hover:bg-muted"
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-foreground text-background">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">If this is the wrong account, please contact the studio manager.</p>
      </div>
    </div>
  );
}
