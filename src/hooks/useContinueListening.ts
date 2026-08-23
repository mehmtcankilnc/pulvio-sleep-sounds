import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// RLS scopes listening_sessions to the caller's own rows (see 0002_rls.sql),
// so no explicit user_id filter is needed here.
export function useContinueListening() {
  const [trackId, setTrackId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("listening_sessions")
      .select("track_id")
      .order("started_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) setTrackId(data?.[0]?.track_id ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return trackId;
}
