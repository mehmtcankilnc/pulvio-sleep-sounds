export type PlaybackDenyReason =
  | "track_not_found"
  | "premium_only"
  | "cooldown"
  | "limit_reached"
  | "invalid_session";

export type StartPlaybackResult =
  | {
      allowed: true;
      session_id: string;
      plan: "free" | "premium";
      cooldown_ends_at: null;
      free_seconds_remaining: number | null;
    }
  | {
      allowed: false;
      reason: PlaybackDenyReason;
      cooldown_ends_at: string | null;
    };

export type HeartbeatResult =
  | {
      allowed: true;
      plan: "free" | "premium";
      cooldown_ends_at: null;
      free_seconds_remaining?: number;
    }
  | {
      allowed: false;
      reason: PlaybackDenyReason;
      cooldown_ends_at: string | null;
      free_seconds_remaining?: number;
    };

export type UserStatusResult = {
  plan: "free" | "premium";
  status: string;
  expires_at: string | null;
  cooldown_ends_at: string | null;
  free_seconds_remaining: number;
};
