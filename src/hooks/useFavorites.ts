import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUserStore } from "../store/useUserStore";

// Single shared table of the signed-in user's favorite track ids — both the
// Now Playing heart and Profile's "Favorite sounds" count read this so a
// like/unlike in one place is instantly reflected in the other.
export function useFavorites() {
  const userId = useUserStore((state) => state.userId);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("favorites").select("track_id").eq("user_id", userId);
    if (!error) setFavoriteIds(new Set((data ?? []).map((row) => row.track_id as string)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Optimistic: flips local state immediately (so the heart never waits on
  // a round trip), rolls back if the write fails.
  async function toggleFavorite(trackId: string) {
    if (!userId) return;
    const wasFavorite = favoriteIds.has(trackId);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(trackId);
      else next.add(trackId);
      return next;
    });

    const { error } = wasFavorite
      ? await supabase.from("favorites").delete().eq("user_id", userId).eq("track_id", trackId)
      : await supabase.from("favorites").insert({ user_id: userId, track_id: trackId });

    if (error) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(trackId);
        else next.delete(trackId);
        return next;
      });
    }
  }

  return { favoriteIds, loading, toggleFavorite, refetch };
}
