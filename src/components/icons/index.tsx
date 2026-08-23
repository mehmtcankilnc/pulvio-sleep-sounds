import Svg, { Path, Rect, Circle } from "react-native-svg";

// Every path below is copied verbatim from C:\Projects\design\drift\DESIGN.html
// (the Drift design source of truth) — never redrawn from memory. Stroke
// icons default to strokeWidth 1.6-1.7 on a 24px grid per DESIGN.md §6;
// play/pause/eq-bars/star are filled.

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

function StrokeIcon({ d, size = 22, color = "#f2b48c", strokeWidth = 1.6 }: IconProps & { d: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return <StrokeIcon {...props} d="M20.6 13.1A8.3 8.3 0 1 1 10.9 3.4a6.5 6.5 0 0 0 9.7 9.7Z" />;
}

export function CloudRainIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#f2b48c"} strokeWidth={props.strokeWidth ?? 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.5 13.5a4 4 0 0 0-.7-7.9 5.2 5.2 0 0 0-10 1.4A3.4 3.4 0 0 0 7 13.7" />
      <Path d="M8 16.5v2.5M12 15.5v3.5M16 16.5v2.5" />
    </Svg>
  );
}

export function WavesIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#f2b48c"} strokeWidth={props.strokeWidth ?? 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
      <Path d="M3 13c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
      <Path d="M3 17.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 3-1.6 4.5 0 3 1.6 4.5 0" />
    </Svg>
  );
}

export function WindIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#f2b48c"} strokeWidth={props.strokeWidth ?? 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8.5h9.5a2.4 2.4 0 1 0-2.3-3" />
      <Path d="M3 12.5h14.5a2.6 2.6 0 1 1-2.5 3.2" />
      <Path d="M4 16.5h6" />
    </Svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#f2b48c"} strokeWidth={props.strokeWidth ?? 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={9} y={3.5} width={6} height={10.5} rx={3} />
      <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <Path d="M12 18v2.5" />
    </Svg>
  );
}

export function MusicIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 22} height={props.size ?? 22} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#f2b48c"} strokeWidth={props.strokeWidth ?? 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.5 18V6.2l10-1.7V16" />
      <Circle cx={7} cy={18} r={2.5} />
      <Circle cx={17} cy={16} r={2.5} />
    </Svg>
  );
}

export function FlameIcon(props: IconProps) {
  return <StrokeIcon {...props} d="M12 3.5c1 2.6 4 4.4 4 8a4.9 4.9 0 0 1-8.6 3.2 M12 21a4.3 4.3 0 0 1-4.3-4.3c0-2.4 1.7-3.5 2.6-5.5.8 1 1.4 1.7 1.7 3 .8-.6 1.3-1.4 1.4-2.4 1.5 1.5 2.9 3.1 2.9 4.9A4.3 4.3 0 0 1 12 21Z" />;
}

export function CompassIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 21} height={props.size ?? 21} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#85716f"} strokeWidth={props.strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6 4.6-1.8Z" />
    </Svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 21} height={props.size ?? 21} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#85716f"} strokeWidth={props.strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 6.5h8M17 6.5h2M5 12h2M11 12h8M5 17.5h8M17 17.5h2" />
      <Circle cx={15} cy={6.5} r={1.8} />
      <Circle cx={9} cy={12} r={1.8} />
      <Circle cx={15} cy={17.5} r={1.8} />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 21} height={props.size ?? 21} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#85716f"} strokeWidth={props.strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8.5} r={3.5} />
      <Path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return <StrokeIcon {...props} d="M6.5 6.5l11 11M17.5 6.5l-11 11" strokeWidth={props.strokeWidth ?? 1.7} />;
}

export function ChevronDownIcon(props: IconProps) {
  return <StrokeIcon {...props} d="m6 9.5 6 6 6-6" strokeWidth={props.strokeWidth ?? 1.7} />;
}

export function ChevronLeftIcon(props: IconProps) {
  return <StrokeIcon {...props} d="m14.5 6-6 6 6 6" strokeWidth={props.strokeWidth ?? 1.7} />;
}

export function HeartIcon(props: IconProps) {
  return <StrokeIcon {...props} d="M12 20.3S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.7-8.5 10.7Z" strokeWidth={props.strokeWidth ?? 1.7} />;
}

export function TimerIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 19} height={props.size ?? 19} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#b49c99"} strokeWidth={props.strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={13} r={7.5} />
      <Path d="M12 9.5V13l2.5 2M10 3h4" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return <StrokeIcon {...props} d="M12 5.5v13M5.5 12h13" strokeWidth={props.strokeWidth ?? 2} />;
}

export function PencilIcon(props: IconProps) {
  return <StrokeIcon {...props} d="M4 20l4.2-1 11-11a1.9 1.9 0 0 0-2.7-2.7l-11 11L4 20Z" strokeWidth={props.strokeWidth ?? 1.7} />;
}

export function BellIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#f2b48c"} strokeWidth={props.strokeWidth ?? 1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.7 8.2a5.7 5.7 0 0 0-11.4 0c0 6.3-2.8 7.3-2.8 7.3h17s-2.8-1-2.8-7.3" />
      <Path d="M10.4 20.5a1.85 1.85 0 0 0 3.2 0" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return <StrokeIcon {...props} d="m9.5 6 6 6-6 6" strokeWidth={props.strokeWidth ?? 1.7} />;
}

export function CheckIcon(props: IconProps) {
  return <StrokeIcon {...props} d="m5.5 12.5 4.2 4.2 8.8-9.4" strokeWidth={props.strokeWidth ?? 2} />;
}

export function PlayIcon({ size = 15, color = "#2b130a" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M8.2 5.4v13.2c0 .8.9 1.3 1.6.9l10.4-6.6c.6-.4.6-1.4 0-1.8L9.8 4.5c-.7-.4-1.6.1-1.6.9Z" />
    </Svg>
  );
}

export function PauseIcon({ size = 17, color = "#2b130a" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={6.5} y={5} width={3.6} height={14} rx={1.4} />
      <Rect x={13.9} y={5} width={3.6} height={14} rx={1.4} />
    </Svg>
  );
}

export function SkipBackIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#b49c99"} strokeWidth={props.strokeWidth ?? 1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18.5 19 9 12l9.5-7v14Z" />
      <Path d="M5.5 5v14" />
    </Svg>
  );
}

export function SkipFwdIcon(props: IconProps) {
  return (
    <Svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke={props.color ?? "#b49c99"} strokeWidth={props.strokeWidth ?? 1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5.5 5 15 12l-9.5 7V5Z" />
      <Path d="M18.5 5v14" />
    </Svg>
  );
}

export function EqBarsIcon({ size = 16, color = "#f2b48c" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Rect x={2} y={6} width={2.6} height={8} rx={1.3} />
      <Rect x={6.7} y={2} width={2.6} height={12} rx={1.3} />
      <Rect x={11.4} y={8} width={2.6} height={6} rx={1.3} />
    </Svg>
  );
}

export function StarIcon({ size = 12, color = "#f4d4bc", opacity = 0.6 }: IconProps & { opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity={opacity}>
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}
