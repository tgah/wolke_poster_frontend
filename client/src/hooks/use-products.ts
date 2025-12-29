import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Product } from "@/types/api";
import { apiFetch } from "@/lib/api-client";

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await apiFetch(api.products.list.path, {
        method: api.products.list.method,
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return (await res.json()) as Product[];
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
