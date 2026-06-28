import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";
import { Tag } from "../../types/database";
import { localCreateTag, localFetchTags } from "../local/localApi";

export const tagsQueryKey = ["tags"] as const;

async function fetchTags(): Promise<Tag[]> {
  if (USE_LOCAL_BACKEND) return localFetchTags();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("is_seeded", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useTags() {
  return useQuery({ queryKey: tagsQueryKey, queryFn: fetchTags });
}

/** Create a custom tag (or return the existing one if the name already exists). */
export function useCreateTag(createdBy: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<Tag> => {
      if (USE_LOCAL_BACKEND) return localCreateTag(name, createdBy);
      const trimmed = name.trim();
      const { data, error } = await supabase
        .from("tags")
        .upsert({ name: trimmed, created_by: createdBy, is_seeded: false }, { onConflict: "name" })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tagsQueryKey }),
  });
}
