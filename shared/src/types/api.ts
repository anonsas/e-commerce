// Plain TypeScript types that describe API response shapes.
// Used by the backend to type its return values and by the frontend with apiFetch<T>.

export type UserRole = "customer" | "support" | "admin";
export const USER_ROLES = { customer: "customer", support: "support", admin: "admin" } as const;

export type OrderStatus = "pending" | "paid" | "failed";
export const ORDER_STATUSES = { pending: "pending", paid: "paid", failed: "failed" } as const;

export type User = {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
};

export type OrderPreviewItem = {
  name: string;
  slug: string;
  imageUrl: string | null;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderWithPreview = Order & {
  previewItems: OrderPreviewItem[];
};

export type OrderItem = {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: Product;
};

// --- Response envelopes ---

export type CheckoutResponse = { checkoutUrl: string };
export type ListProductsResponse = { products: Product[] };
export type GetProductResponse = { product: Product };
export type MeResponse = { user: User };
export type ListOrdersResponse = { orders: OrderWithPreview[] };
export type GetOrderResponse = { order: Order; items: OrderItem[] };
export type StreamTokenResponse = { token: string; apiKey: string; userId: string; name: string };

// Short-lived credentials the backend signs before the browser uploads directly to ImageKit.
export type ImageKitAuthResponse = {
  publicKey: string;
  signature: string;
  token: string;
  expire: number;
  urlEndpoint: string;
};

export type CategoriesResponse = { categories: string[] };

// Admin product includes imageKitFileId so the admin UI can delete the file from ImageKit when removing a product.
export type AdminProduct = Product & { imageKitFileId: string | null; updatedAt: string };
export type ListAdminProductsResponse = { products: AdminProduct[] };
