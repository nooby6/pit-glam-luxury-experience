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

export function useLiveServices(fallbackServices: LiveService[]) {
  const [services, setServices] = useState(() => fallbackServices);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const liveWindow = window as LiveServicesWindow;
    if (Array.isArray(liveWindow.__PIT_GLAM_LIVE_SERVICES__) && liveWindow.__PIT_GLAM_LIVE_SERVICES__.length > 0) {
      setServices(liveWindow.__PIT_GLAM_LIVE_SERVICES__);
    }
  }, []);

  return { services, isHydrated };
}