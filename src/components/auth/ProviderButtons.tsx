import { Platform, Pressable, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../../hooks/useThemeColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_EASE = Easing.bezier(0.23, 1, 0.32, 1);

// The two OAuth buttons render in the providers' own required look, not the
// app palette — a user has to recognise them as the trusted Apple / Google
// buttons (Apple's Sign in with Apple guidelines + App Store 4.8 expect the
// real treatment, not a text label). Both kept dark so they still sit calmly
// on the bedtime screen. Same 54pt pill + press-scale as the app's Button.
function ProviderButton({
  label,
  glyph,
  bg,
  fg,
  border,
  onPress,
  loading,
}: {
  label: string;
  glyph: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  border?: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const press = (to: number) =>
    (scale.value = withTiming(to, { duration: 150, easing: PRESS_EASE, reduceMotion: ReduceMotion.System }));

  return (
    <AnimatedPressable
      onPress={loading ? undefined : onPress}
      onPressIn={() => press(0.97)}
      onPressOut={() => press(1)}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: !!loading }}
      style={[
        {
          minHeight: 54,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingHorizontal: 24,
          backgroundColor: bg,
          borderWidth: border ? 1 : 0,
          borderColor: border,
        },
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Ionicons name={glyph} size={19} color={fg} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: fg }}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

export function OrDivider({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.stroke }} />
      <Text style={{ fontSize: 12, color: colors.faint }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.stroke }} />
    </View>
  );
}

export function ProviderButtons({
  appleLabel,
  googleLabel,
  onApple,
  onGoogle,
  pending,
}: {
  appleLabel: string;
  googleLabel: string;
  onApple: () => void;
  onGoogle: () => void;
  pending?: "apple" | "google" | null;
}) {
  return (
    <View style={{ gap: 10 }}>
      {Platform.OS === "ios" ? (
        <ProviderButton
          label={appleLabel}
          glyph="logo-apple"
          bg="#000000"
          fg="#ffffff"
          onPress={onApple}
          loading={pending === "apple"}
        />
      ) : null}
      <ProviderButton
        label={googleLabel}
        glyph="logo-google"
        bg="#131314"
        fg="#e3e3e3"
        border="#5f6368"
        onPress={onGoogle}
        loading={pending === "google"}
      />
    </View>
  );
}
