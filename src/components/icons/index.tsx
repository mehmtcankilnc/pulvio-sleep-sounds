import { Ionicons } from "@expo/vector-icons";

// Icons are Ionicons glyphs. Each exported component keeps its previous
// name/prop signature (size, color, strokeWidth, filled) so every call site
// across the app is untouched — only the rendered glyph changed.

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

export function MoonIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="moon-outline" size={size} color={color} />;
}

export function CloudRainIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="rainy-outline" size={size} color={color} />;
}

export function WavesIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="water-outline" size={size} color={color} />;
}

export function WindIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="cloud-outline" size={size} color={color} />;
}

export function MicIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="mic-outline" size={size} color={color} />;
}

export function MusicIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="musical-notes-outline" size={size} color={color} />;
}

export function FlameIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="flame-outline" size={size} color={color} />;
}

export function CompassIcon({ size = 21, color = "#85716f" }: IconProps) {
  return <Ionicons name="compass-outline" size={size} color={color} />;
}

export function SlidersIcon({ size = 21, color = "#85716f" }: IconProps) {
  return <Ionicons name="options-outline" size={size} color={color} />;
}

export function UserIcon({ size = 21, color = "#85716f" }: IconProps) {
  return <Ionicons name="person-outline" size={size} color={color} />;
}

export function XIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="close" size={size} color={color} />;
}

export function ChevronDownIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="chevron-down" size={size} color={color} />;
}

export function ChevronLeftIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="chevron-back" size={size} color={color} />;
}

export function HeartIcon({ size = 22, color = "#f2b48c", filled = false }: IconProps & { filled?: boolean }) {
  return <Ionicons name={filled ? "heart" : "heart-outline"} size={size} color={color} />;
}

export function TimerIcon({ size = 19, color = "#b49c99" }: IconProps) {
  return <Ionicons name="time-outline" size={size} color={color} />;
}

export function PlusIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="add" size={size} color={color} />;
}

export function MinusIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="remove" size={size} color={color} />;
}

export function PencilIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="pencil-outline" size={size} color={color} />;
}

export function BellIcon({ size = 20, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="notifications-outline" size={size} color={color} />;
}

export function ChevronRightIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="chevron-forward" size={size} color={color} />;
}

export function CheckIcon({ size = 22, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="checkmark" size={size} color={color} />;
}

export function PlayIcon({ size = 15, color = "#2b130a" }: IconProps) {
  return <Ionicons name="play" size={size} color={color} />;
}

export function PauseIcon({ size = 17, color = "#2b130a" }: IconProps) {
  return <Ionicons name="pause" size={size} color={color} />;
}

export function SkipBackIcon({ size = 24, color = "#b49c99" }: IconProps) {
  return <Ionicons name="play-skip-back" size={size} color={color} />;
}

export function SkipFwdIcon({ size = 24, color = "#b49c99" }: IconProps) {
  return <Ionicons name="play-skip-forward" size={size} color={color} />;
}

export function EqBarsIcon({ size = 16, color = "#f2b48c" }: IconProps) {
  return <Ionicons name="bar-chart" size={size} color={color} />;
}

export function StarIcon({ size = 12, color = "#f4d4bc", opacity = 0.6 }: IconProps & { opacity?: number }) {
  return <Ionicons name="star" size={size} color={color} style={{ opacity }} />;
}
