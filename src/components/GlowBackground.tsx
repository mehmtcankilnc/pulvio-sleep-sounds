import { useState } from "react";
import { StyleSheet, View, type ViewStyle, type LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from "react-native-svg";
import { colors } from "../theme/colors";

// Drift atmosphere recipes (DESIGN.md §3): every wash is a radial glow
// layered over a base — no blur() anywhere, ever. `origin` is a 0-100
// percentage pair matching CSS `circle at X% Y%`; `extent` is the 0-100
// color-stop position matching CSS `transparent NN%`.
//
// CSS's radial-gradient (shape: circle, no explicit size) sizes itself to
// the *farthest corner* from the center — `extent` is a fraction of THAT
// distance, not of the box width/height directly. For an off-canvas origin
// (e.g. "-12% 34%") the farthest corner is far away, so the visible glow is
// much bigger than `extent`% of the box would suggest. Matching that
// requires the real pixel size of the box (via onLayout) to compute the
// true corner distance — a fixed normalized viewBox can't reproduce it.
type Origin = { x: number; y: number };
type Wash = { origin: Origin; color: string; extent: number };

function farthestCornerDistance(cx: number, cy: number, width: number, height: number): number {
  const dx = Math.max(cx, width - cx);
  const dy = Math.max(cy, height - cy);
  return Math.sqrt(dx * dx + dy * dy);
}

function RadialWash({ origin, color, extent, width, height }: Wash & { width: number; height: number }) {
  if (width === 0 || height === 0) return null;
  const cx = (origin.x / 100) * width;
  const cy = (origin.y / 100) * height;
  const r = (extent / 100) * farthestCornerDistance(cx, cy, width, height);
  const id = `wash-${origin.x}-${origin.y}-${extent}`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgRadialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={Math.max(r, 1)}>
          {/* Eased falloff (not a flat 1→0 linear ramp): tames the peak so
              it doesn't read as an oversaturated blob against the near-black
              base, and the extra stops spread the alpha ramp over more of
              the radius, which visibly reduces 8-bit banding vs. a hard
              two-stop gradient on Android's SVG rasterizer. */}
          <Stop offset="0%" stopColor={color} stopOpacity={0.42} />
          <Stop offset="10%" stopColor={color} stopOpacity={0.36} />
          <Stop offset="18%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="28%" stopColor={color} stopOpacity={0.23} />
          <Stop offset="40%" stopColor={color} stopOpacity={0.17} />
          <Stop offset="52%" stopColor={color} stopOpacity={0.12} />
          <Stop offset="65%" stopColor={color} stopOpacity={0.07} />
          <Stop offset="80%" stopColor={color} stopOpacity={0.03} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

type Variant = "pageWash" | "nightScene" | "heroCard" | "artworkTile";

const VARIANTS: Record<Variant, { washes: Wash[]; base: [string, string]; baseLocations?: [number, number, number]; baseDirection: "vertical" | "diagonal" }> = {
  // Default (Sleep-style single top-center glow); some screens
  // override with their own wash(es) via the `washes` prop — see
  // DESIGN.html for the exact per-screen origin/extent values.
  pageWash: { washes: [{ origin: { x: 50, y: -8 }, color: colors.glow, extent: 46 }], base: [colors.bg, colors.bg], baseDirection: "vertical" },
  nightScene: {
    washes: [{ origin: { x: 50, y: 30 }, color: colors.glow, extent: 52 }],
    base: [colors.bgTop, colors.bgDeep],
    baseLocations: [0, 0.55, 1],
    baseDirection: "vertical",
  },
  heroCard: { washes: [{ origin: { x: 82, y: 8 }, color: colors.glow, extent: 62 }], base: [colors.cardSoft, colors.card], baseDirection: "diagonal" },
  artworkTile: { washes: [{ origin: { x: 50, y: 30 }, color: colors.glow, extent: 78 }], base: [colors.bgTop, colors.bgDeep], baseDirection: "vertical" },
};

export function GlowBackground({
  variant,
  washes,
  style,
  children,
  testID,
}: {
  variant: Variant;
  /** Override the variant's default wash(es) — see DESIGN.html per-screen values. */
  washes?: Wash[];
  style?: ViewStyle;
  children?: React.ReactNode;
  /** Stable target for QA / screenshot (Goldie) flows. */
  testID?: string;
}) {
  const spec = VARIANTS[variant];
  const activeWashes = washes ?? spec.washes;
  const gradientColors = spec.baseLocations ? [spec.base[0], colors.bg, spec.base[1]] : spec.base;
  const [size, setSize] = useState({ width: 0, height: 0 });

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }

  return (
    <View testID={testID} style={[{ overflow: "hidden" }, style]} onLayout={handleLayout}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        locations={spec.baseLocations as [number, number, ...number[]] | undefined}
        start={{ x: 0, y: 0 }}
        end={spec.baseDirection === "diagonal" ? { x: 1, y: 1 } : { x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {activeWashes.map((wash, i) => (
        <RadialWash key={i} {...wash} width={size.width} height={size.height} />
      ))}
      {children}
    </View>
  );
}

// Moon ring (DESIGN.md §3): outer glow ring + inner soft-fill ring, used on
// Now Playing behind the breathing moon icon. Callers always pass an explicit
// square `style`, so the wash size is read straight off `style.width`.
export function MoonRingOuter({ style, children }: { style?: ViewStyle & { width: number; height: number }; children?: React.ReactNode }) {
  const size = typeof style?.width === "number" ? style.width : 0;
  return (
    <View style={[{ borderRadius: 999, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
      <RadialWash origin={{ x: 50, y: 42 }} color={colors.glow} extent={70} width={size} height={size} />
      {children}
    </View>
  );
}

export function MoonRingInner({ style, children }: { style?: ViewStyle & { width: number; height: number }; children?: React.ReactNode }) {
  const size = typeof style?.width === "number" ? style.width : 0;
  return (
    <View style={[{ borderRadius: 999, borderWidth: 1, borderColor: colors.stroke, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
      <RadialWash origin={{ x: 50, y: 38 }} color={colors.glowSoft} extent={78} width={size} height={size} />
      {children}
    </View>
  );
}
