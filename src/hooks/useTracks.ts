import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Track } from "../types";

export type TrackSection = {
  title: string;
  data: Track[];
};

function mapRowToTrack(row: {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  duration: number;
  storage_url: string;
  cover_url: string | null;
  is_premium_only: boolean;
}): Track {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory,
    durationSeconds: row.duration,
    storageUrl: row.storage_url,
    coverUrl: row.cover_url ?? undefined,
    isPremiumOnly: row.is_premium_only,
  };
}

// Standalone (not part of the hook) — used by the bedtime-play notification
// tap handler, which needs a single track outside of any component's list
// state.
export async function fetchTrackById(trackId: string): Promise<Track | null> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id, title, category, subcategory, duration, storage_url, cover_url, is_premium_only")
    .eq("id", trackId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToTrack(data);
}

export function useTracks() {
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTracks() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("tracks")
      .select("id, title, category, subcategory, duration, storage_url, cover_url, is_premium_only")
      .order("category")
      .order("subcategory");

    if (fetchError) {
      console.error("useTracks: failed to fetch tracks", fetchError);
      setError(fetchError.message);
      setSections([]);
      setLoading(false);
      return;
    }

    const tracks = (data ?? []).map(mapRowToTrack);
    const grouped = new Map<string, Track[]>();
    for (const track of tracks) {
      const key = `${track.category} / ${track.subcategory}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(track);
    }

    setSections(Array.from(grouped.entries()).map(([title, data]) => ({ title, data })));
    setLoading(false);
  }

  useEffect(() => {
    fetchTracks();
  }, []);

  return { sections, loading, error, refetch: fetchTracks };
}
