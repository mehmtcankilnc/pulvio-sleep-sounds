// Content-width caps for the scrolling screens. On a phone these are inert
// (the screen is already narrower); on a tablet they hold the content in a
// centred, readable column instead of letting every row, heading and
// full-width button stretch edge to edge.

// Browse / list / tab screens — wide enough that the horizontal card rails
// on Home still feel generous.
export const SCREEN_CONTENT_MAX_W = 600;

// Single-column forms (auth). Matches the player's centred column so the
// pre-auth funnel and the app read as one width.
export const FORM_MAX_W = 460;

// Spread into a ScrollView / SectionList `contentContainerStyle`, or onto a
// wrapper View, to centre a capped column.
export const centeredColumn = {
  width: "100%",
  maxWidth: SCREEN_CONTENT_MAX_W,
  alignSelf: "center",
} as const;
