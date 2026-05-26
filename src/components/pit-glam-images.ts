// Responsive WebP image sets for Pit Glam — generated from optimized variants.
import brows480 from "@/assets/real-brows-lashes-480.webp";
import brows800 from "@/assets/real-brows-lashes-800.webp";
import brows1200 from "@/assets/real-brows-lashes-1200.webp";

import mirror480 from "@/assets/real-lash-mirror-480.webp";
import mirror800 from "@/assets/real-lash-mirror-800.webp";
import mirror1200 from "@/assets/real-lash-mirror-1200.webp";

import closeup480 from "@/assets/real-lash-closeup-480.webp";
import closeup628 from "@/assets/real-lash-closeup-628.webp";

export type ImgSet = {
  src: string;
  srcSet: string;
  width: number;
  height: number;
};

export const browsImg: ImgSet = {
  src: brows800,
  srcSet: `${brows480} 480w, ${brows800} 800w, ${brows1200} 1200w`,
  width: 1200,
  height: 900,
};

export const mirrorImg: ImgSet = {
  src: mirror800,
  srcSet: `${mirror480} 480w, ${mirror800} 800w, ${mirror1200} 1200w`,
  width: 1200,
  height: 900,
};

export const closeupImg: ImgSet = {
  src: closeup628,
  srcSet: `${closeup480} 480w, ${closeup628} 628w`,
  width: 628,
  height: 1280,
};

// Default sizes attribute for card / gallery tiles in a 1–3 col responsive grid.
export const cardSizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
