import { useEffect, useState } from "react";

export type LiveService = {
  name: string;
  desc: string;
  price: string;
  time: string;
  img: string;
};

type LiveServicesWindow = Window & {
  __PIT_GLAM_LIVE_SERVICES__?: LiveService[];
};

function areServicesEqual(a: LiveService[], b: LiveService[]) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

// SSR-safe hook: returns server-provided `fallbackServices` during SSR
// and only applies the client-provided live services after hydration.
export function useLiveServices(fallbackServices: LiveService[]) {
  const [services, setServices] = useState<LiveService[]>(() => fallbackServices);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const liveWindow = window as LiveServicesWindow;
    const live = liveWindow.__PIT_GLAM_LIVE_SERVICES__;

    if (!Array.isArray(live) || live.length === 0) return;

    // Only replace the server-rendered services if the live data is meaningfully
    // different — this avoids unnecessary DOM/content swaps on first load
    // which can trigger hydration warnings or janky layout shifts.
    if (!areServicesEqual(live, fallbackServices)) {
      setServices(live);
    }
  }, [fallbackServices]);

  return { services, isHydrated };
}