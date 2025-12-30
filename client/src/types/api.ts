// Frontend-only API types
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/auth/login',
    },
    me: {
      method: 'GET' as const,
      path: '/auth/me',
    },
    // Note: backend has no logout endpoint - logout is client-side only
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/products',
    },
    import: {
      method: 'POST' as const,
      path: '/products/import',
    },
  },
  posters: {
    create: {
      method: 'POST' as const,
      path: '/posters',
    },
    get: {
      method: 'GET' as const,
      path: '/posters/:id',
    },
  },
  // Note: /backgrounds endpoints don't exist in backend
  // Background generation is handled through poster endpoints
};

export type LoginInput = {
  email: string;
  password: string;
  totp_code?: string;
};

export type Background = {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  url?: string;
  created_at?: string;
};

export type Product = {
  id: number;
  name: string;
  price: string;
  imagePath?: string;
};

export type Poster = {
  id: string;
  status?: string;
  url?: string;
  created_at?: string;
};