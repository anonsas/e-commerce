// How it fits in the app:
//   1. Admin uploads a product image → ImageKit stores the original, gives back a delivery URL
//   2. Backend saves that URL in products.image_url (one URL per product, no size variants)
//   3. This file transforms that URL at render time by injecting ImageKit's tr: path segment
//   4. The browser fetches the right-sized version — ImageKit resizes, compresses, and converts
//      format on its CDN edge nodes so we never serve a 4 MB JPEG to a mobile card

// Connection to the rest of the codebase:
//   - product.controller.ts   → returns imageUrl from DB (raw original)
//   - ProductCard.tsx         → calls imageKitOptimizedUrl(product.imageUrl, IK_PRESETS.catalogCard)
//   - CartItem component      → uses IK_PRESETS.cartThumb
//   - Admin product table     → uses IK_PRESETS.adminThumb
//   - Product detail page     → uses IK_PRESETS.productHero

// Non-ImageKit URLs (e.g. plain Unsplash links used in seed data) are returned as-is,
// so the app works even without ImageKit configured in development.

export type ImageKitTransformOpts = {
  w?: number;
  h?: number;
  q?: number;
  f?: string;
  crop?: "at_max" | "maintain_ratio";
  watermark?: boolean;
};

// Scales the watermark font relative to the image dimensions so it stays readable at any size.
function buildIgorLukjanovTextLayer({ w, h }: Pick<ImageKitTransformOpts, "w" | "h">): string {
  const maxDim = Math.max(w != null && w > 0 ? w : 0, h != null && h > 0 ? h : 0, 200);
  let fs = 28;
  if (maxDim <= 180) fs = 11;
  else if (maxDim <= 240) fs = 13;
  else if (maxDim <= 400) fs = 16;
  else if (maxDim <= 700) fs = 22;
  else fs = 30;
  return `l-text,i-IgorLukjanov,fs-${fs},co-FFFFFF,bg-0F172A90,pa-8_12,lx-N14,ly-14,lap-top_right,l-end`;
}

// tr: is an ImageKit path segment that encodes transformations directly in the URL.
// Example: https://ik.imagekit.io/demo/tr:w-800,h-600,c-at_max,q-80,f-auto/photo.jpg
//   w-800      → resize to max 800px wide
//   h-600      → resize to max 600px tall
//   c-at_max   → fit the full image within the box (no cropping); CSS object-cover handles visual framing
//   q-80       → compress to 80% quality
//   f-auto     → let ImageKit pick the best format (WebP, AVIF) based on the browser's Accept header
// ImageKit processes this on its CDN edge and caches the result — the original file is never changed.
// See https://imagekit.io/docs/image-resize-and-crop
function buildTransformationSegment({
  w,
  h,
  q = 80,
  f = "auto",
  crop,
  watermark = false,
}: ImageKitTransformOpts): string {
  const parts: string[] = [];
  if (w != null && w > 0) parts.push(`w-${Math.round(w)}`);
  if (h != null && h > 0) parts.push(`h-${Math.round(h)}`);
  // With both w and h, ImageKit defaults to c-maintain_ratio (center crop). For product photos we
  // prefer c-at_max: full image inside the box, no CDN crop; CSS object-cover handles framing.
  if (w != null && w > 0 && h != null && h > 0) {
    parts.push(`c-${crop ?? "at_max"}`);
  }
  parts.push(`q-${Math.min(100, Math.max(1, Math.round(q)))}`);
  parts.push(`f-${f}`);
  const base = `tr:${parts.join(",")}`;
  if (!watermark) return base;
  return `${base}:${buildIgorLukjanovTextLayer({ w, h })}`;
}

// Returns true for URLs served by ImageKit — either ik.imagekit.io or a custom subdomain
// configured via VITE_IMAGEKIT_URL_ENDPOINT. Plain Unsplash/S3/etc. URLs return false.
function isImageKitDeliveryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("ik.imagekit.io")) return true;
    const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "");
    if (endpoint && url.startsWith(endpoint)) return true;
    return false;
  } catch {
    return false;
  }
}

// Injects a tr: segment into an existing ImageKit URL, stripping any previous transformation
// so callers don't have to worry about double-transforming an already-optimized URL.
// Non-ImageKit URLs pass through unchanged — safe to call on any product.imageUrl.
export function imageKitOptimizedUrl(
  url: string | null | undefined,
  opts: ImageKitTransformOpts = {},
): string | undefined {
  if (url == null || url === "") return url ?? undefined;
  if (!isImageKitDeliveryUrl(url)) return url;

  const transformationSegment = buildTransformationSegment(opts);

  try {
    const u = new URL(url);

    if (u.hostname.endsWith("ik.imagekit.io")) {
      const segments = u.pathname.split("/").filter(Boolean);
      if (segments.length < 2) return url;
      const id = segments[0];
      const rest = segments.slice(1);
      // Remove any existing tr: segment so we don't stack transformations.
      while (rest.length && rest[0].toLowerCase().startsWith("tr")) {
        rest.shift();
      }
      if (!rest.length) return url;
      u.pathname = `/${id}/${transformationSegment}/${rest.join("/")}`;
      return u.toString();
    }

    const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "");
    if (endpoint && url.startsWith(endpoint)) {
      const epUrl = new URL(endpoint);
      const basePath = epUrl.pathname.replace(/\/$/, "") || "";
      if (!u.pathname.startsWith(basePath)) return url;
      const rel = u.pathname.slice(basePath.length).replace(/^\//, "");
      const relSegs = rel.split("/").filter(Boolean);
      while (relSegs.length && relSegs[0].toLowerCase().startsWith("tr")) {
        relSegs.shift();
      }
      if (!relSegs.length) return url;
      u.pathname = `${basePath}/${transformationSegment}/${relSegs.join("/")}`;
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

// Watermark: ImageKit renders a semi-transparent "IgorLukjanov" text badge in the top-right corner
// of the image on the CDN — no image editing needed on our side. Use this when the image will
// leave the app (share links, download buttons) so the brand is visible outside the storefront.
export function imageKitWatermarkedUrl(
  url: string | null | undefined,
  opts: ImageKitTransformOpts = {},
): string | undefined {
  return imageKitOptimizedUrl(url, { ...opts, watermark: true });
}

// One preset per UI context. Sizes are 2× the CSS layout size for retina screens.
// Add a new preset here whenever a new image display context is introduced.
export const IK_PRESETS = {
  catalogCard: { w: 800, h: 600, q: 80, f: "auto" },
  productHero: { w: 1200, h: 1200, q: 82, f: "auto" },
  adminThumb: { w: 144, h: 144, q: 80, f: "auto" },
  cartThumb: { w: 192, h: 192, q: 80, f: "auto" },
  orderLineThumb: { w: 224, h: 224, q: 80, f: "auto" },
  orderPreviewMd: { w: 176, h: 176, q: 80, f: "auto" },
  orderPreviewLg: { w: 288, h: 288, q: 80, f: "auto" },
  formPreview: { w: 640, h: 320, q: 80, f: "auto" },
} satisfies Record<string, ImageKitTransformOpts>;
