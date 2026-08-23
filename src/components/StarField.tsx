import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme/colors";

// Copied verbatim from the Now Playing artboard in DESIGN.html — inline SVG
// dots, never images, never blur.
const STARS: Array<[number, number, number, number]> = [
  [30, 90, 1.4, 0.7],
  [78, 48, 1.1, 0.5],
  [140, 120, 1.6, 0.8],
  [205, 60, 1.1, 0.45],
  [268, 105, 1.4, 0.65],
  [330, 70, 1.1, 0.5],
  [355, 150, 1.5, 0.7],
  [55, 190, 1.1, 0.4],
  [305, 210, 1.2, 0.5],
  [110, 235, 1.1, 0.35],
  [240, 175, 1.1, 0.4],
  [180, 40, 1.2, 0.55],
];

export function StarField({ width = 390, height = 280 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 390 280" style={{ position: "absolute", top: 0, left: 0 }} pointerEvents="none">
      {STARS.map(([cx, cy, r, opacity], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill={colors.star} opacity={opacity} />
      ))}
    </Svg>
  );
}
