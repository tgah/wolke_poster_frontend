import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Product } from "@/types/api";
import { apiFetch } from "@/lib/api-client";

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      // Backend expects limit parameter for max_products
      const res = await apiFetch(`${api.products.list.path}?limit=10`, {
        method: api.products.list.method,
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return data.products || data; // Handle both array and object response
    },
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiFetch(api.products.import.path, {
        method: api.products.import.method,
        body: formData,
      });
      if (!res.ok) throw new Error("Import failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}
