import { z } from 'zod';
import { insertUserSchema, insertProductSchema, insertPosterSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
        code: z.string().optional(), // 2FA code placeholder
      }),
      responses: {
        200: z.object({
          access_token: z.string(),
          token_type: z.string(),
          user: z.any(), // User object
        }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.any(), // User object
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
        method: 'POST' as const,
        path: '/api/auth/logout',
        responses: {
            200: z.object({ message: z.string() })
        }
    }
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()), // Array of Products
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/products/import',
      // Multipart form data not strictly validated by zod here, handled in route
      responses: {
        200: z.object({
          processed: z.number(),
          succeeded: z.number(),
          failed: z.number(),
        }),
      },
    },
  },
  posters: {
    create: {
      method: 'POST' as const,
      path: '/api/posters',
      input: insertPosterSchema,
      responses: {
        201: z.any(), // Poster
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/posters/:id',
      responses: {
        200: z.any(), // Poster
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/posters/:id',
      input: insertPosterSchema.partial(),
      responses: {
        200: z.any(), // Poster
        404: errorSchemas.notFound,
      },
    },
    generateBackground: {
      method: 'POST' as const,
      path: '/api/posters/:id/background/generate',
      input: z.object({ themeText: z.string() }),
      responses: {
        200: z.object({ message: z.string() }), // Async initiation
        404: errorSchemas.notFound,
      },
    },
    export: {
      method: 'POST' as const,
      path: '/api/posters/:id/export',
      input: z.object({
        format: z.enum(['png', 'pdf']),
        resolution: z.enum(['digital', 'print']),
      }),
      responses: {
        200: z.object({ url: z.string() }),
      },
    },
  },
  assets: {
    getUrl: {
      method: 'GET' as const,
      path: '/api/assets/:id/url',
      responses: {
        200: z.object({ url: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
