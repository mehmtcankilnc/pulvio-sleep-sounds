# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Primary user: someone who struggles to fall asleep and opens the app wanting an ambient sound or sleep story playing quickly, without hunting for new content on YouTube every night. Sessions happen at bedtime, usually in a dark room, often one-handed and half-attentive — the interface needs to work for someone who is deliberately trying to disengage, not focus.

## Product Purpose

Pulvio plays ambient sounds and sleep stories to help people fall asleep faster. It exists so a person doesn't have to search for "new" sleep content every night — a small, curated, repeatable catalog instead of an endless feed. Success is a user who reliably reaches for Pulvio at bedtime instead of YouTube or a competitor, and who upgrades from the free tier because the limit is honestly enforced, not because they were tricked into it.

## Positioning

A narrow, no-bloat sleep-sound utility — not a full meditation/wellness/journaling suite like Calm. The freemium model is meant to be more honest and accessible than an established player's harder paywall: a real (if limited) free tier with a server-enforced cooldown, not a trial that vanishes into a hard wall. This is the current stated direction, not yet validated against real competitive response — record it as the working thesis, not a proven moat.

## Operating Context

- Used at bedtime, typically in the dark, often with the phone screen dimmed or face-down nearby.
- Playback must survive app backgrounding (lock-screen controls, background audio) since the user is trying to fall asleep with the screen off.
- Multilingual user base by design: English, Turkish, German, French, Spanish, and Brazilian Portuguese (Portuguese added specifically because competitor research showed high download volume from Brazil that Calm under-serves in that language).
- Free-tier sessions are short (a few minutes) and gated by a cooldown before the same user can start another one.

## Capabilities and Constraints

- **Cooldown is server-only, by design.** `cooldownEndsAt` is computed and returned by the backend; the client never derives it from the device clock. This is a deliberate anti-cheat decision (device clock rollback must not bypass the limit) and must be preserved by any future freemium/limit-related work.
- **All audio content must be CC0 or equivalent commercially-clean licensed.** Sourced from Freesound (CC0 filter only), Pixabay Audio/Music, Zapsplat, YouTube Audio Library (no-attribution filter), Free Music Archive (CC0/CC-BY filter). This is a hard constraint, not a placeholder — Pulvio does not license a commercial sound library.
- **ASMR content is deliberately deferred**, not forgotten: genuinely free, commercially-usable ASMR content doesn't practically exist at the needed scale/license cleanliness. Roadmapped as its own future phase (likely paid work-for-hire recording), not part of the current catalog.
- **Native platform, not a web wrapper.** Ships via Expo/React Native as real iOS and Android builds (custom dev client, not Expo Go) — background audio, push notifications, and in-app purchase all depend on native modules.
- **Subscription entitlement is server-trusted.** RevenueCat webhooks sync entitlement state into the backend; the client does not self-report subscription status as authoritative.

## Brand Commitments

- Name **Pulvio** derives from Latin *pulvinus* ("pillow/cushion"). App Store/Google Play/domain name availability was checked and is clear, but this was a web/store search only — no formal trademark (USPTO/EUIPO) clearance has been done yet.
- Current visual identity ("Drift"): a single fixed dark theme (deep plum/near-black background with a warm peach/apricot glow accent) — intentionally no light mode and no per-OS visual variation. Preserve this as the incumbent visual world for any refinement work; a genuine redesign would need to consciously decide whether to keep or replace it.

## Evidence on Hand

- No real user testimonials, case studies, or press exist yet — do not fabricate any for marketing or onboarding copy.
- Competitive research exists (Calm, via appfigures): US leads revenue and downloads but is declining; Brazil is the #2 download market by volume while barely registering in revenue (high-volume, low-monetization market); Australia is the only revenue-growing market observed. Cross-usage data shows the expected meditation/sleep app overlap plus an unexpected overlap with gratitude/journaling apps (a "bedtime journal" feature was discussed and consciously deferred, not part of MVP scope).
- Full audio/category taxonomy and sourcing strategy is documented (two-level `category`/`subcategory` schema); actual catalog content population status should be verified against the current Supabase `tracks` table rather than assumed from this record.

## Product Principles

1. **Never fake urgency or scarcity around the limit.** The cooldown is a real, server-enforced constraint — the product's credibility depends on the limit being exactly what it claims to be, not a dark-pattern trial.
2. **Stay narrow.** Resist scope creep toward a general wellness/meditation suite; the product's stated edge is being a focused sound utility, not a Calm competitor on Calm's terms.
3. **Bedtime-appropriate by default.** Any UI, copy, or notification design should assume a user trying to disengage in a dark room — low-stimulation, low-friction, not attention-seeking.
4. **License cleanliness is non-negotiable.** Every piece of audio content must trace to a commercially-clean license; this constrains the catalog's growth rate more than user demand does.
5. **Trust is server-side.** Any limit, entitlement, or time-based restriction is computed and enforced on the backend — the client displays state, it does not decide it.

## Accessibility & Inclusion

No formal accessibility standard has been confirmed as a requirement yet. Given the bedtime/dark-room usage context, treat low-vision and low-light legibility (contrast, target size, one-handed reachability) as a de facto product need even though no formal audit has been commissioned.
