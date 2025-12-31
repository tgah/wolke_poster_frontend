// Frontend-only API types
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
    },
    // Note: backend has no logout endpoint - logout is client-side only
  },
  backgrounds: {
    generate: { method: "POST" as const, path: "/api/backgrounds/generate" },
    get:      { method: "GET"  as const, path: "/api/backgrounds/:id" },
    list:     { method: "GET"  as const, path: "/api/backgrounds" },
    upload:   { method: "POST" as const, path: "/api/backgrounds/upload" },
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
    },
    import: {
      method: 'POST' as const,
      path: '/api/products/import',
    },
  },
  posters: {
    create: {
      method: 'POST' as const,
      path: '/api/posters',
    },
    get: {
      method: 'GET' as const,
      path: '/api/posters/:id',
    },
    export: {
      method: 'POST' as const,
      path: '/api/posters/:id/export',
    },
  },
};

export type LoginInput = {
  email: string;
  password: string;
  totp_code?: string;
};

export type Background = {
  id: string;
  status: "generating" | "pending" | "processing" | "ready" | "failed";
  url?: string;
  created_at?: string;
};

export type Product = {
  artikelNr: string;
  chineseName?: string;
  germanName?: string;
  weight?: string;
  oldPrice?: number;
  newPrice: number;
};

export type Poster = {
  id: string;
  status?: string;
  url?: string;
  created_at?: string;
};