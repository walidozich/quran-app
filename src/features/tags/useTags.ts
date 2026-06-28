import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { Tag } from "../../types/database";

export const tagsQueryKey = ["tags"] as const;

async function fetchTags(): Promise<Tag[]> {
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
