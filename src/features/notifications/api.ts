import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { NotificationRow } from "../../types/database";

export type NotificationItem = NotificationRow & { actor: { full_name: string } | null };

export const notificationKeys = {
  list: (userId: string) => ["notifications", userId] as const,
  unread: (userId: string) => ["notifications", "unread", userId] as const,
};

async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(full_name)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<NotificationItem[]>();
  if (error) throw error;
  return data ?? [];
}

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: () => fetchNotifications(userId),
    enabled: Boolean(userId),
  });
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.unread(userId ?? "none"),
    queryFn: () => fetchUnreadCount(userId as string),
    enabled: Boolean(userId),
    refetchInterval: 30000,
  });
}

/** Mark every unread notification for this user as read. */
export function useMarkAllRead(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", userId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      qc.invalidateQueries({ queryKey: notificationKeys.unread(userId) });
    },
  });
}

/** Mark a single notification as read. */
export function useMarkRead(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      qc.invalidateQueries({ queryKey: notificationKeys.unread(userId) });
    },
  });
}
