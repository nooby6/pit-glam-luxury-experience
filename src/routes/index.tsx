import { createFileRoute } from "@tanstack/react-router";
import PitGlam from "@/components/PitGlam";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pit Glam · Premium Brows & Lashes Studio in Nairobi" },
      { name: "description", content: "Nairobi's boutique brows and lashes atelier. Lash extensions, brow lamination, bridal beauty and more in Valley Arcade, Kilimani. Book your private ritual today." },
      { property: "og:title", content: "Pit Glam · Because your Brows & Lashes Matter" },
      { property: "og:description", content: "Luxury brows and lashes studio in Valley Arcade, Kilimani, Nairobi. Certified artists, premium products, unforgettable results." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: PitGlam,
});
