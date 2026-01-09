// client/src/hooks/use-posters.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getFullAssetUrl } from "@/lib/api-client";
import { api, type Poster } from "@/types/api";

export type ProductInput = {
  artikelNr: string;
  image: File | null;
  salePrice?: number;
};

export type CreatePosterInput = {
  templateKey: string;
  maxProducts: number;
  backgroundId: string;
  saleTitle: string;
  products: ProductInput[];
};

/**
 * Fetch all posters (if backend supports it)
 */
export function usePosters() {
  const queryClient = useQueryClient();

  const postersQuery = useQuery({
    queryKey: ["posters"],
    queryFn: async () => {
      // Use the correct path for listing posters (same as create path but GET method)
      const res = await apiFetch(api.posters.create.path, { method: "GET" });

      if (!res.ok) {
        let msg = res.statusText;
        try {
          const errorText = await res.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              msg = errorJson.message || errorJson.error || errorText;
            } catch {
              msg = errorText;
            }
          }
        } catch {
          // If we can't read the response, use statusText
        }
        throw new Error(msg);
      }

      return (await res.json()) as Poster[];
    },
  });

  /**
   * Create poster (multipart)
   */
  const createPosterMutation = useMutation({
    mutationFn: async (input: CreatePosterInput) => {
      const form = new FormData();

      // Required base fields
      form.append("background_id", input.backgroundId);
      form.append("template_key", input.templateKey);
      form.append("sale_title", input.saleTitle);

      // Product fields by looping exactly i < maxProducts
      for (let i = 0; i < input.maxProducts; i++) {
        const product = input.products[i];
        form.append(`artikel_nr_${i}`, product.artikelNr);
        form.append(`product_image_${i}`, product.image!);

        // Add sale_price if available
        if (product.salePrice !== undefined) {
          form.append(`sale_price_${i}`, product.salePrice.toString());
        }
      }

      const res = await apiFetch(api.posters.create.path, {
        method: api.posters.create.method,
        body: form,
      });

      if (!res.ok) {
        let msg = res.statusText;
        try {
          const errorText = await res.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              msg = errorJson.message || errorJson.error || errorText;
            } catch {
              msg = errorText;
            }
          }
        } catch {
          // If we can't read the response, use statusText
        }
        throw new Error(`Poster creation failed: ${msg}`);
      }

      return (await res.json()) as Poster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posters"] });
    },
  });

  return {
    posters: postersQuery.data ?? [],
    isLoading: postersQuery.isLoading,

    createPoster: createPosterMutation.mutate,
    isCreating: createPosterMutation.isPending,
  };
}

export function useCreatePoster() {
  const { createPoster, isCreating } = usePosters();
  return { mutate: createPoster, isPending: isCreating };
}

/**
 * Hook to get a specific poster by ID
 */
export function usePoster(id: string) {
  return useQuery({
    queryKey: ["poster", id],
    queryFn: async () => {
      const res = await apiFetch(api.posters.get.path.replace(':id', id), {
        method: api.posters.get.method,
      });
      if (!res.ok) throw new Error("Failed to fetch poster");
      return (await res.json()) as Poster;
    },
    enabled: !!id,
  });
}

/**
 * Export poster to get downloadable URL
 */
export async function exportPoster(posterId: string) {
  const res = await apiFetch(api.posters.export.path.replace(':id', posterId), {
    method: api.posters.export.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      format: "png",
      resolution: "digital",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Export failed: ${errorText}`);
  }

  const result = (await res.json()) as { asset_id: string; url: string; format: string };

  // Transform the URL to be a full URL if it's an /assets path
  return {
    ...result,
    url: getFullAssetUrl(result.url),
  };
}
