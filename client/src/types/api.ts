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
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
    }
  },
  backgrounds: {
    list: {
      method: 'GET' as const,
      path: '/api/backgrounds',
    },
    get: {
      method: 'GET' as const,
      path: '/api/backgrounds/:id',
    },
    generate: {
      method: 'POST' as const,
      path: '/api/backgrounds/generate',
    },
    upload: {
      method: 'POST' as const,
      path: '/api/backgrounds/upload',
    },
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
  },
};

export type LoginInput = {
  email: string;
  password: string;
  totp_code?: string;
};

export type Background = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
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