import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPoster } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePoster(id: number) {
  return useQuery({
    queryKey: [api.posters.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.posters.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch poster");
      return api.posters.get.responses[200].parse(await res.json());
    },
    // Poll while status is generating
    refetchInterval: (query) => 
      query.state.data?.status === 'generating' ? 2000 : false,
  });
}

export function useCreatePoster() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertPoster) => {
      const res = await fetch(api.posters.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create poster");
      return api.posters.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posters"] }); // Generalized key if we had a list
      toast({ title: "Poster created", description: "Draft saved successfully." });
    },
  });
}

export function useUpdatePoster() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertPoster>) => {
      const url = buildUrl(api.posters.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update poster");
      return api.posters.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.posters.get.path, data.id] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Update failed", description: "Could not save changes." });
    }
  });
}

export function useGenerateBackground() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, themeText }: { id: number; themeText: string }) => {
      const url = buildUrl(api.posters.generateBackground.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeText }),
      });
      if (!res.ok) throw new Error("Failed to start generation");
      return api.posters.generateBackground.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate specific poster to trigger polling
      queryClient.invalidateQueries({ queryKey: [api.posters.get.path, variables.id] });
      toast({ title: "Generating Background", description: "AI is creating your design..." });
    },
  });
}
