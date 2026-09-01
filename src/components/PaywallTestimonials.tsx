/** @jsxImportSource react */
// Kept OUTSIDE NativeWind's JSX transform (babel sets jsxImportSource:
// "nativewind" project-wide). Nothing here uses `className` — only inline
// styles — so opting out costs nothing and avoids NativeWind's wrapper
// swallowing refs / interfering with Reanimated.
//
// The carousel is driven by a Reanimated translateX on a row of all cards —
// NOT a ScrollView/FlatList. Getting a working ref to a native scroll node
// (to call scrollTo) proved unreliable here with NativeWind + a horizontal
// pager nested in the vertical page ScrollView, so autoplay never moved.
// A shared-value translate uses the exact primitives the dots already use,
// and swipe is handled with the core PanResponder (no extra dependency).
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, PanResponder, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../hooks/useThemeColors";
import { StarIcon } from "./icons";

export type Testimonial = { quote: string; author: string };

// Curve reused from Button.tsx / profile.tsx for the app's press/settle feel.
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
// A brighter peach-gold than `accent` for the rating stars — still inside the
// ember hue family, just lifted so the row reads as a positive highlight.
// Deliberate one-off: used only here, so it stays a local const rather than a
// design-system token.
const STAR_COLOR = "#ffca97";
const INTERVAL_MS = 3000;
const SLIDE_MS = 380;
// After a swipe, hold autoplay off one full interval so it doesn't yank away.
const PAUSE_AFTER_INTERACT_MS = INTERVAL_MS;
// Fraction of a page you must drag (or fling) to advance on release.
const SWIPE_THRESHOLD = 0.25;
// How far past the first / last card a drag may rubber-band, in page fractions.
const OVERSCROLL = 0.12;

// Ember-family tints for the initials avatar — no invented face photos (the
// quotes are placeholders; fabricated reviewer photos would be worse), and
// this needs no network, which a bedtime app can't rely on.
const AVATAR_TINTS = ["#f2b48c", "#e0a86a", "#d98a63", "#e6b9a0", "#d97e52"];

function Avatar({ name }: { name: string }) {
  const colors = useThemeColors();
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const bg = AVATAR_TINTS[h % AVATAR_TINTS.length];
  return (
    <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 11, fontWeight: "800", color: colors.buttonText }}>{initial}</Text>
    </View>
  );
}

function ReviewCard({ item }: { item: Testimonial }) {
  const { t } = useTranslation("paywall");
  const colors = useThemeColors();
  return (
    <View style={{ gap: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 16, padding: 14 }}>
      <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={t("socialProofRating")}>
        {[0, 1, 2, 3, 4].map((s) => (
          <StarIcon key={s} size={12} color={STAR_COLOR} strokeWidth={1.8} />
        ))}
      </View>
      <Text style={{ fontSize: 13.5, color: colors.text, lineHeight: 19 }}>{item.quote}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <Avatar name={item.author} />
        <Text style={{ fontSize: 11.5, color: colors.muted }}>{item.author}</Text>
      </View>
    </View>
  );
}

function CarouselDot({ active }: { active: boolean }) {
  const colors = useThemeColors();
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, { duration: 220, easing: EASE, reduceMotion: ReduceMotion.System });
  }, [active, p]);
  // Fixed 6px footprint + a transform scale — never changes layout, so the
  // row can't shimmer as the active dot changes.
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.4 }],
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.faint, colors.accent]),
  }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 999 }, style]} />;
}

// Reviews as a pager: auto-advances every ~4.5s, swipe to move by hand (which
// holds autoplay off briefly), and it never animates under Reduce Motion.
// Editing the caller's array is all it takes to change the content.
export function Testimonials({ items }: { items: Testimonial[] }) {
  const { t } = useTranslation("paywall");
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const widthRef = useRef(0);
  const indexRef = useRef(0);
  const tx = useSharedValue(0);
  const dragStartTx = useRef(0);
  const pausedUntil = useRef(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
      reduceMotion.current = v;
    });
    return () => sub.remove();
  }, []);

  // Reads widthRef (not the width state) so the identity stays stable — the
  // PanResponder below is created once and closes over this.
  const goTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, i));
      indexRef.current = clamped;
      setIndex(clamped);
      const target = -clamped * widthRef.current;
      tx.value = reduceMotion.current ? target : withTiming(target, { duration: SLIDE_MS, easing: EASE });
    },
    [items.length, tx]
  );

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        pausedUntil.current = Number.MAX_SAFE_INTEGER; // frozen while a finger is down
        dragStartTx.current = -indexRef.current * widthRef.current;
      },
      onPanResponderMove: (_, g) => {
        const w = widthRef.current || 1;
        const min = -(items.length - 1) * w - OVERSCROLL * w;
        const max = OVERSCROLL * w;
        tx.value = Math.max(min, Math.min(max, dragStartTx.current + g.dx));
      },
      onPanResponderRelease: (_, g) => {
        const w = widthRef.current || 1;
        let next = indexRef.current;
        if (g.dx < -w * SWIPE_THRESHOLD || g.vx < -0.35) next += 1;
        else if (g.dx > w * SWIPE_THRESHOLD || g.vx > 0.35) next -= 1;
        goTo(next);
        pausedUntil.current = Date.now() + PAUSE_AFTER_INTERACT_MS;
      },
      onPanResponderTerminate: () => {
        goTo(indexRef.current);
        pausedUntil.current = Date.now() + PAUSE_AFTER_INTERACT_MS;
      },
    })
  ).current;

  // One interval for the component's life once measured. Each tick just
  // no-ops while autoplay is paused after an interaction.
  useEffect(() => {
    if (items.length < 2 || width === 0) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      goTo((indexRef.current + 1) % items.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [items.length, width, goTo]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  if (items.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.2, color: colors.muted }}>
        {t("testimonialsHeading")}
      </Text>

      <View
        style={{ overflow: "hidden" }}
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w > 0 && w !== widthRef.current) {
            widthRef.current = w;
            setWidth(w);
            tx.value = -indexRef.current * w; // keep current card aligned at the new width
          }
        }}
        // A single testimonial has nowhere to swipe — don't attach a dead
        // gesture responder that could still steal touches from the page.
        {...(items.length > 1 ? pan.panHandlers : null)}
      >
        {width > 0 ? (
          <Animated.View style={[{ flexDirection: "row", width: width * items.length }, rowStyle]}>
            {items.map((item) => (
              <View key={item.author} style={{ width }}>
                <ReviewCard item={item} />
              </View>
            ))}
          </Animated.View>
        ) : (
          <ReviewCard item={items[0]} />
        )}
      </View>

      {items.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 2 }}>
          {items.map((_, i) => (
            <CarouselDot key={i} active={i === index} />
          ))}
        </View>
      )}
    </View>
  );
}
