import { useEffect, useState } from "react";
import i18n from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { compareTracks } from "../lib/catalogTaxonomy";
import { localizedTrackTitle } from "../lib/trackTitle";
import type { Track } from "../types";

export type TrackSection = {
  category: string;
  subcategory: string;
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
    title: localizedTrackTitle(row.title, row.storage_url, i18n.language),
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

    // Unordered fetch — the deliberate browse order (taxonomy position, then
    // free-before-premium, then title) is applied client-side below via
    // compareTracks so it stays in one place shared with any other consumer,
    // instead of duplicating it as a second `.order()` chain here.
    const { data, error: fetchError } = await supabase
      .from("tracks")
      .select("id, title, category, subcategory, duration, storage_url, cover_url, is_premium_only");

    if (fetchError) {
      console.error("useTracks: failed to fetch tracks", fetchError);
      setError(fetchError.message);
      setSections([]);
      setLoading(false);
      return;
    }

    const tracks = (data ?? []).map(mapRowToTrack).sort((a, b) => compareTracks(a, b, i18n.language));
    const grouped = new Map<string, { category: string; subcategory: string; data: Track[] }>();
    for (const track of tracks) {
      const key = `${track.category}/${track.subcategory}`;
      if (!grouped.has(key)) grouped.set(key, { category: track.category, subcategory: track.subcategory, data: [] });
      grouped.get(key)!.data.push(track);
    }

    setSections(Array.from(grouped.values()));
    setLoading(false);
  }

  useEffect(() => {
    fetchTracks();
    // Titles, category/subcategory labels and the sort's locale-aware
    // localeCompare all depend on the current language — re-run the fetch
    // (cheap: 99 rows) whenever the user switches language in Settings so
    // an already-mounted list doesn't keep showing the old language.
    i18n.on("languageChanged", fetchTracks);
    return () => {
      i18n.off("languageChanged", fetchTracks);
    };
  }, []);

  return { sections, loading, error, refetch: fetchTracks };
}
