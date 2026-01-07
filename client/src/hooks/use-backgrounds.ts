// client/src/hooks/use-backgrounds.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getFullAssetUrl } from "@/lib/api-client";
import { apiRequest } from "@/lib/queryClient";
import { api, type Background } from "@/types/api";

/**
 * Poll a background until it's completed and has a URL.
 */
async function pollBackground(id: string): Promise<Background> {
  const intervalMs = 2000;
  const maxAttempts = 60;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const bg = await apiRequest<Background>(api.backgrounds.get.path.replace(':id', id), {
      method: api.backgrounds.get.method,
    });

    if (bg.status === "ready" && bg.url) {
      // Transform the URL to be a full URL if it's an /assets path
      return {
        ...bg,
        url: getFullAssetUrl(bg.url),
      };
    }

    if (bg.status === "failed") {
      throw new Error("Background generation failed.");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Background generation timed out.");
}

export function useBackgrounds() {
  const queryClient = useQueryClient();

  /**
   * Fetch all available backgrounds
   */
  const backgroundsQuery = useQuery({
    queryKey: ["backgrounds"],
    queryFn: async () => {
      const backgrounds = await apiRequest<Background[]>(api.backgrounds.list.path, {
        method: api.backgrounds.list.method,
      });

      // Transform all background URLs to full URLs
      return backgrounds.map(bg => ({
        ...bg,
        url: bg.url ? getFullAssetUrl(bg.url) : bg.url,
      }));
    },
  });

  /**
   * Generate background from theme text
   */
  const generateMutation = useMutation({
    mutationFn: async (themeText: string) => {
      const res = await apiFetch(api.backgrounds.generate.path, {
        method: api.backgrounds.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme_text: themeText }),
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
        throw new Error(`Generate failed: ${msg}`);
      }

      const data = (await res.json()) as { id: string };
      if (!data?.id) {
        throw new Error("No background ID returned.");
      }

      return pollBackground(data.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgrounds"] });
    },
  });

  /**
   * Upload background image (multipart)
   */
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);

      const res = await apiFetch(api.backgrounds.upload.path, {
        method: api.backgrounds.upload.method,
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
        throw new Error(`Upload failed: ${msg}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backgrounds"] });
    },
  });

  return {
    backgrounds: backgroundsQuery.data ?? [],
    isLoading: backgroundsQuery.isLoading,

    generateBackground: generateMutation.mutate,
    isGenerating: generateMutation.isPending,

    uploadBackground: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
  };
}
