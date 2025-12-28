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

// Background Response Schema
const backgroundSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['generating', 'completed', 'failed']),
  url: z.string().optional(),
  created_at: z.string(),
  error: z.string().optional(),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string(),
        totp_code: z.string().optional(),
      }),
      responses: {
        200: z.object({
          access_token: z.string(),
          token_type: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.any(),
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
  backgrounds: {
    list: {
      method: 'GET' as const,
      path: '/api/backgrounds',
      responses: {
        200: z.array(backgroundSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/backgrounds/:id',
      responses: {
        200: backgroundSchema,
        404: errorSchemas.notFound,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/backgrounds/generate',
      input: z.object({
        theme_text: z.string().min(5),
      }),
      responses: {
        202: backgroundSchema,
        400: errorSchemas.validation,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/backgrounds/upload',
      // multipart/form-data: file
      responses: {
        200: backgroundSchema,
        400: errorSchemas.validation,
      },
    },
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
      // multipart/form-data with background_id, template_key, product images
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
