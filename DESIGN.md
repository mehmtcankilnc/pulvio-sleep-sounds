---
name: Pulvio
description: Dusk Ember — a dark, glow-lit sleep-sounds app with no light mode and no stimulation
colors:
  bg: "#1a1118"
  bgTop: "#2a1a21"
  bgDeep: "#120a10"
  card: "#251a22"
  cardSoft: "#31222c"
  stroke: "rgba(242,180,140,0.14)"
  text: "#f6ede9"
  muted: "#b49c99"
  faint: "#85716f"
  accent: "#f2b48c"
  button: "#d97e52"
  buttonText: "#2b130a"
  glow: "rgba(230,140,90,0.26)"
  glowSoft: "rgba(230,140,90,0.12)"
  moon: "#ffe9d6"
  star: "#f4d4bc"
  sliderTrack: "rgba(255,255,255,0.07)"
  toggleOffTrack: "rgba(255,255,255,0.09)"
  notice: "#e0a86a"
  danger: "#e0655c"
  dangerGlow: "rgba(224,101,92,0.13)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "46px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  heroTitle:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "25px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  screenTitle:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.2px"
  brand:
    fontFamily: "Lora Italic, Georgia italic"
    fontSize: "24px"
    fontWeight: 500
  eyebrow:
    fontFamily: "Lora Italic, Georgia italic"
    fontSize: "15px"
    fontWeight: 400
  overline:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "10.5px"
    fontWeight: 700
    letterSpacing: "0.14em"
  sectionHeading:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "15.5px"
    fontWeight: 700
  cardTitle:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "19px"
    fontWeight: 700
  body:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "14px"
    fontWeight: 600
  secondary:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "12.5px"
    fontWeight: 400
  caption:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "11px"
    fontWeight: 400
  navLabel:
    fontFamily: "Plus Jakarta Sans, Segoe UI, system-ui"
    fontSize: "10px"
    fontWeight: 500
rounded:
  screen: "28px"
  heroCard: "24px"
  listCard: "20px"
  categoryCard: "18px"
  optionRow: "16px"
  artworkTile: "13px"
  pill: "999px"
spacing:
  screenX: "20px"
  screenTop: "28px"
  sectionGap: "18px"
  cardGap: "10px"
  gridGap: "11px"
components:
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.buttonText}"
    rounded: "{rounded.pill}"
    height: "54px"
    padding: "0 24px"
  button-primary-pressed:
    backgroundColor: "{colors.button}"
    textColor: "{colors.buttonText}"
    rounded: "{rounded.pill}"
    height: "54px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "54px"
  pill-active:
    backgroundColor: "{colors.button}"
    textColor: "{colors.buttonText}"
    rounded: "{rounded.pill}"
    height: "44px"
  pill-inactive:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    height: "44px"
  list-row-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.listCard}"
    padding: "14px"
---

# Design System: Pulvio

## Overview

**Creative North Star: "Dusk Ember"**

Pulvio is a sleep-sounds app, and every visual decision serves exactly one goal: lower the user's arousal level. The UI is meant to be the last calm thing someone sees before they put the phone down — not a dashboard, not a feed, not a thing that competes for attention. Dusk Ember is the implemented direction: a near-black plum base (`#1a1118`) lit only by a single warm peach/ember glow (`#f2b48c`/`#d97e52`), rendered as soft layered radial gradients rather than any hard light source. There is one hue family in the whole app. There is no light mode — night is the product, not a theme option.

The system is deliberately restrained rather than richly decorated: flat surfaces, no drop shadows, no blur or frosted glass, no icon chips, no gamification (no streaks, badges, counters, confetti, red dots). If an element would excite a half-asleep user rather than settle them, it doesn't belong. Two ambient motions are sanctioned, both on Now Playing and both tied to a real function, not decoration: (1) the slow "breathe" — a ring that scales almost imperceptibly over seven seconds; (2) the **sleep-timer ring** — a thin `accent` arc around the moon that depletes over the armed duration (15m–45m), moving sub-pixel per second and stepping coarsely (15s) under Reduce Motion. It exists because the sleep timer is Now Playing's real clock and a half-asleep user needs a glanceable "how long until this stops". Nothing else animates: everything else fades or resolves quickly and quietly.

The app ships as one native codebase on iOS and Android with this single fixed dark visual language; it does not adapt per OS. Real device affordances (safe areas, back gesture, keyboard handling) still apply per platform even though the skin itself never changes.

**Key Characteristics:**
- Dark plum base + one warm ember glow, applied as radial-gradient washes, never a hard light or blur
- Flat by default — depth comes from tonal layering and glow, never `box-shadow`
- Bare content icons in the accent color, no tinted icon-chip backgrounds
- One primary action per screen; a drowsy user should never have to choose between competing CTAs
- Ionicons "outline" glyphs carry all iconography — not custom stroke SVGs

## Colors

The palette is nearly monochrome by design: one warm ember hue carries every accent, highlight, and call to action against a near-black plum ground. Nothing else is allowed to introduce a second hue.

### Primary
- **Ember** (`#d97e52`, token `button`): the one interactive color — primary buttons, active pills/chips, the toggle-on track, the slider fill's warm end. Text and icons drawn on it always use `buttonText` (`#2b130a`), never white.
- **Peach** (`#f2b48c`, token `accent`): content icons, highlights, links, eyebrow labels, selected-state borders. This is the color a sleepy eye should find first on a screen.

### Neutral
- **Near-black plum** (`#1a1118`, token `bg`): base screen background.
- **Night gradient top** (`#2a1a21`, token `bgTop`) / **Night gradient deep** (`#120a10`, token `bgDeep`): the two ends of the vertical night-scene gradient (Player, Welcome, Paywall).
- **Card plum** (`#251a22`, token `card`) / **Card plum, lighter** (`#31222c`, token `cardSoft`): cards, the dock, round icon buttons; `cardSoft` is the lighter end of hero-card gradients only.
- **Warm hairline** (`rgba(242,180,140,0.14)`, token `stroke`): every border and divider in the app, without exception.
- **Warm white** (`#f6ede9`, token `text`): primary text.
- **Dusty rose** (`#b49c99`, token `muted`): secondary text, inactive control-icon color.
- **Faded rose** (`#85716f`, token `faint`): captions, disabled states, inactive nav labels.
- **Moonlight** (`#ffe9d6`, token `moon`): the moon illustration, the toggle-on knob.
- **Starlight** (`#f4d4bc`, token `star`): starfield dots, always inline SVG, never image assets.
- **Ember glow, strong** (`rgba(230,140,90,0.26)`, token `glow`) / **Ember glow, soft** (`rgba(230,140,90,0.12)`, token `glowSoft`): the radial wash atmosphere and selected-state fills, respectively.

- **Notice amber** (`#e0a86a`, token `notice`): the sanctioned "something needs your attention" text color for *recoverable* events — a load failure, a free-limit stop. A warmer, higher-value step of the same ember hue, deliberately not a red: a red flash for a mundane, recoverable stop over-signals. Used for short notice lines only, never as a fill or border.
- **Danger red** (`#e0655c`, token `danger`) / **Danger glow** (`rgba(224,101,92,0.13)`, token `dangerGlow`): the one true red in the system, reserved for *irreversible destructive* actions — today that is delete-account only. It is desaturated and pushed toward the warm end so it still belongs to Dusk Ember rather than firing as a cold system-red alarm, but it reads unmistakably as red next to the ember accent. Legible as text/icon/border on `bg` (~5:1); a solid `danger` button pairs it with dark `buttonText`, never white, and stays flat (the shadow carve-out is the ember primary only). Restraint is the rule: the Settings "danger zone" group uses only the `danger` border + overline (icon and title on its delete row also `danger`) — **not** a full `dangerGlow` fill, which over-signals on a near-monochrome bedtime screen. The full red-bordered treatment belongs on the confirmation sheet. `dangerGlow` stays available as a faint fill for a surface that is entirely about the destructive act. Not for errors or warnings — those stay `notice`.

### Named Rules
**The One Hue Rule.** Every accent, highlight, and glow shares the same peach/ember hue family — including `notice`, which is a hue-family member, not an exception. The single deliberate departure is `danger` (`#e0655c`), used *only* on irreversible destructive actions (delete account); it is still warm-shifted to sit as close to the family as a recognizable red can. Any other off-family hue (a blue, a cold pure red, a green) is a signal something has gone off-brief, not a local decision.

**The Button-Text Rule.** Text or an icon drawn directly on `button` (`#d97e52`) is always `buttonText` (`#2b130a`). White-on-ember never happens, even for a single label.

## Typography

**Display / UI Font:** Plus Jakarta Sans (weights 400–800), fallback Segoe UI / system-ui
**Warm-Moment Font:** Lora Italic, fallback Georgia italic

**Character:** A geometric, confident UI face carries structure and controls; a single italic serif is reserved for the handful of moments meant to feel human rather than functional — a greeting, a scene name, a piece of reassurance copy.

### Hierarchy
- **Display** (700, 46px, −0.01em): the bedtime-wheel time readout — the single largest number in the app.
- **Hero title** (700, 25–27px, −0.01em): Welcome/Plan-ready/Paywall headlines.
- **Screen title** (700, 22–24px, −0.2px): per-tab greeting, Now Playing title, quiz questions.
- **Brand / scene name** (Lora Italic, 22–26px): the wordmark and named scenes.
- **Eyebrow** (Lora Italic, 15–16px, `accent`): warm framing lines above a screen title — "Tonight", "Good evening".
- **Overline** (700, 10.5–11px, +0.14em tracking, uppercase, `accent` or `muted`): section labels like "SLEEP SCHEDULE".
- **Section heading** (700, 15.5px): group titles inside a screen ("Tonight's routine").
- **Card title** (700, 19–20px): a hero card's main label.
- **Body / row label** (600, 14–15px): setting-row titles, option labels.
- **Secondary** (400–600, 12.5–13.5px, `muted`): subtitles, row descriptions.
- **Caption** (400, 11–12px, `faint`): helper lines, counts.
- **Nav label** (500, 10px; 700 when active): dock tab labels.

### Named Rules
**The One Lora Rule.** At most one italic-serif moment per screen. Lora marks warmth (a greeting, a scene name); it never labels a control or a setting row.

## Layout

Screens are a single vertical `ScrollView` with 20px horizontal padding and 28–32px top padding, laid out with `gap` between sections (16–18px) rather than per-child margins. Cards use 9–14px internal gaps. The two-column grids that do exist (category tiles) use `repeat(2, minmax(0,1fr))` with an 11px gap. Every tappable control keeps at least a 44×44 hit area, independent of its visual size (a 20px bare icon still sits inside a ≥44px pressable region via padding).

The bottom of every tab screen is owned by a persistent dock (see Components → Navigation) that is edge-to-edge and safe-area–aware, not a floating inset card — screen content reserves space for it via the tab bar's measured height rather than the dock overlapping content.

## Elevation & Depth

There are no shadows anywhere in this system, and no blur or frosted-glass effects. Depth is conveyed entirely through two mechanisms: tonal layering (a lighter plum, `cardSoft`, against the darker `card`/`bg`) and soft radial-gradient "glow" washes composited under content. A primary button is the one exception with a literal `shadowColor`/`shadowRadius`, but even that resolves to a soft ember glow, not a hard elevation shadow.

### Named Rules
**The No-Blur Rule.** All atmosphere and depth comes from layered radial/linear gradients. `blur()`/`BlurView` never appears, anywhere, for any reason.

**The Flat-By-Default Rule.** Surfaces sit flat against their background. The only thing that lifts a surface visually is a glow wash underneath it, never a shadow.

## Shapes

Radius scales with a surface's role, from soft screen corners down to hard pill shapes for anything track- or button-shaped:

- **28px** — screen corners (where applicable)
- **24px** — hero cards
- **20px** — list/settings cards
- **18px** — category/plan cards
- **16px** — option rows, continue rows
- **13px** — artwork tiles
- **999px** — pills, circular buttons, toggle/slider tracks

Every card and row gets a `1px solid stroke` border by default; a selected state upgrades to a `1px accent` (or `1.5px accent` for an emphasized card) border, generally paired with a `glowSoft` fill rather than a color swap alone.

## Components

### Buttons
- **Shape:** full pill (999px radius).
- **Primary:** height 54, full-width, `button` background, `buttonText` label (15px/700), soft ember glow shadow (`shadowColor: glow`, no hard elevation). One per screen — this is the app's only real call-to-action pattern.
- **Outline/Ghost:** same 54px pill, transparent background, `stroke` border, `text` or `accent` label depending on emphasis.
- **Press feedback:** every primary/ghost button and pressable row scales to ~0.97–0.98 on press (Reanimated `withTiming`, ~150ms, a strong custom ease-out `cubic-bezier(0.23,1,0.32,1)`) rather than a bare opacity dim. This is the app-wide press vocabulary — new pressables should reuse it, not invent an opacity-only fallback.

### Pills & Chips
Timer/option chips are 44px tall by default (down to ~34–38px in dense rows). Selected state crossfades background/border/text color via `interpolateColor` (180ms, `cubic-bezier(0.77,0,0.175,1)`) rather than a hard cut, plus a selection haptic on commit. Active: `button` background + `buttonText` label. Inactive: `card` background + `stroke` border + `muted` label. `∞` is set as literal typography, never an icon.

### Cards
- **Hero card:** 24px radius, ~16–18px padding, diagonal `cardSoft → card` gradient plus a top-right glow wash; left text stack, right bare illustration icon.
- **Category card:** 18px radius, 12–14px padding, ~86–96px min-height; bare icon → name → count, stacked.
- **List/settings card:** 20px radius, rows ≥56px tall separated by 1px `stroke` hairlines — bare icon (20px) → label (14px/600, optional 11.5px `faint` subtitle) → trailing value/chevron/toggle. This is the dominant content pattern across Sleep and Profile.

### Controls
- **Toggle:** 44×26px track, 999px radius, 3px inset, 20px knob. Track color crossfades via `interpolateColor` (200ms, `cubic-bezier(0.77,0,0.175,1)`); the knob's position animates on a separate spring (`dampingRatio 0.8`, 400ms) rather than the same timing curve as the color — two different physical qualities (a color state change vs. a knob that physically moves) get two different animation types, not one curve reused for both. On: `button` track, `moon` knob, knob right. Off: `toggleOffTrack` (`rgba(255,255,255,0.09)`), `faint` knob, knob left. Fires a selection haptic on every change.
- **Slider / progress:** track height 3–6px, 999px radius, neutral `sliderTrack` background; fill is `button`, no gradient sweep in the currently-shipped player/dock progress bars (the two-color `button→accent` fill described in the original brief is not what's implemented — a flat `button` fill is).

### Navigation (the dock)
The bottom bar is edge-to-edge, not a floating inset pill: `card` background, a 1px `stroke` top border, `paddingBottom` matched to the device safe-area inset. It has two states:
- **Idle** (nothing playing): a plain 3-item nav row (Explore · Sleep · Profile — no Mixer, that surface was removed from the app). Active tab: `accent` icon/label, 700 weight. Inactive: `faint`, 500 weight. No dots, no pill highlight behind the active item.
- **Playing:** the nav row is preceded by a mini-player block (bare artwork tile → title/category → 44px circular play/pause in `button` → 44px ghost dismiss ✕) and a 3px progress line, separated from the nav row by a hairline. The mini player fades and scales in from 0.96→1 (never from 0) rather than a flat opacity swap, and its native content mounts once per session instead of being torn down between plays.

### Iconography
Icons are `Ionicons` "outline" glyphs (`@expo/vector-icons`), not hand-drawn stroke SVGs — every icon component still accepts a `strokeWidth` prop for call-site compatibility, but it is currently inert; Ionicons' fixed glyph weight is what actually renders. Color still follows a strict role convention: `accent` for content icons (categories, row leads, checks), `muted` for control icons (back, heart, dismiss, skip), `faint` for inactive nav/chevrons, `moon` reserved for the moon glyph itself. Icons sit bare on their surface — see the Do's and Don'ts rule below.

## Do's and Don'ts

### Do:
- **Do** keep every accent, highlight, and glow inside the single peach/ember hue family (`accent`/`button`/`glow`/`glowSoft`).
- **Do** put `buttonText` on anything drawn directly on a `button`-colored surface, never white or `text`.
- **Do** use the scale-press feedback recipe (`~0.97 scale`, ~150ms, `cubic-bezier(0.23,1,0.32,1)`) for new pressables instead of an opacity-only press state.
- **Do** build depth with tonal layering and radial-gradient glow washes, never `box-shadow` or blur.
- **Do** give every card/row a `1px stroke` border at rest, upgrading to `accent` on selection.

### Don't:
- **Don't** put a tinted rounded-square/circle chip behind a content icon. Icons sit bare in their accent color. (Round *control* buttons — back, heart, play/pause — are a control's own circular background, not an icon chip, and keep it.)
- **Don't** add streaks, badges, unread-style counters, confetti, or red notification dots — or any other element designed to spike attention rather than settle it.
- **Don't** use `blur()`/`BlurView` anywhere; every soft edge in this app is a gradient, never a blur.
- **Don't** assume passing `strokeWidth` to an icon component changes anything visually — the icon set is Ionicons glyphs now, and that prop is inert.
- **Don't** build a second primary CTA on a screen that already has one. One decision per screen is the rule, not a suggestion.
