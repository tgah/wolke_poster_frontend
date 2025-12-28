// client/src/hooks/use-posters.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { api } from "@shared/routes";

export type Poster = {
  id: string;
  status?: string;
  url?: string;
  created_at?: string;
};

export type CreatePosterInput = {
  backgroundId: string;
  templateKey: string;
  saleTitle: string;
  images: File[];
  prices: number[];
  artikelNrs: string[];
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
        const msg = await res.text();
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

      // Required base fields with exact snake_case keys
      form.append("background_id", input.backgroundId);
      form.append("template_key", input.templateKey);
      form.append("sale_title", input.saleTitle);

      // Product rows with exact snake_case keys
      input.images.forEach((image, index) => {
        form.append(`artikel_nr_${index}`, input.artikelNrs[index] || "");
        form.append(`sale_price_${index}`, input.prices[index]?.toString() || "0");
        form.append(`product_image_${index}`, image);
      });

      const res = await apiFetch(api.posters.create.path, {
        method: api.posters.create.method,
        body: form,
      });

      if (!res.ok) {
        const msg = await res.text();
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
