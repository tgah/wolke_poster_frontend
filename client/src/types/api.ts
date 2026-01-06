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
  backgrounds: {
    generate: { method: "POST" as const, path: "/backgrounds/generate" },
    get:      { method: "GET"  as const, path: "/backgrounds/:id" },
    list:     { method: "GET"  as const, path: "/backgrounds" },
    upload:   { method: "POST" as const, path: "/backgrounds/upload" },
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
    export: {
      method: 'POST' as const,
      path: '/posters/:id/export',
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