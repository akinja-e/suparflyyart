/**
 * Commerce domain types. UI components consume these shapes only, never a
 * backend's raw response — so swapping local data for Shopify later means
 * writing one adapter, not touching components.
 */

export interface Money {
  /** Decimal amount, e.g. 240.00 (adapters convert Shopify's decimal strings). */
  amount: number;
  currencyCode: string;
}

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductModel {
  /** Draco/Meshopt-compressed GLB. */
  src: string;
  /** Lighter GLB for phones; falls back to `src` when absent. */
  mobileSrc?: string;
  /** Rendered still used when 3D is unavailable or too costly. */
  poster: string;
  /** Named lighting rig, chosen per product category. */
  lighting: "gallery" | "studio" | "toy" | "sculpture";
}

export interface ProductVariant {
  id: string;
  title: string;
  price: Money;
  available: boolean;
  options: Record<string, string>;
}

export interface Product {
  id: string;
  handle: string;
  name: string;
  description: string;
  category: "art" | "toys" | "apparel" | "objects";
  price: Money;
  images: ProductImage[];
  model?: ProductModel;
  variants: ProductVariant[];
  materials: string[];
  featured: boolean;
}
