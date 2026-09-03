import { Platform, Pressable, Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../../hooks/useThemeColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_EASE = Easing.bezier(0.23, 1, 0.32, 1);
const BUTTON_HEIGHT = 54;

// Google button: the providers' own look, not the app palette — a user has
// to recognise it as the trusted Google button. Kept dark so it still sits
// calmly on the bedtime screen. Same 54pt pill + press-scale as the app's
// Button. (Apple has its own native component below — see ProviderButtons.)
function GoogleButton({
  label,
  onPress,
  loading,
}: {
  label: string;
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
          minHeight: BUTTON_HEIGHT,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          paddingHorizontal: 24,
          backgroundColor: "#131314",
          borderWidth: 1,
          borderColor: "#5f6368",
        },
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#e3e3e3" />
      ) : (
        <>
          <Ionicons name="logo-google" size={19} color="#e3e3e3" />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#e3e3e3" }}>{label}</Text>
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
  googleLabel,
  onApple,
  onGoogle,
  pending,
  appleButtonType = "signIn",
}: {
  googleLabel: string;
  onApple: () => void;
  onGoogle: () => void;
  pending?: "apple" | "google" | null;
  /** Drives the native Apple button's own (OS-localised) label. */
  appleButtonType?: "signIn" | "signUp";
}) {
  const colors = useThemeColors();
  const applePending = pending === "apple";

  return (
    <View style={{ gap: 10 }}>
      {Platform.OS === "ios" ? (
        applePending ? (
          // The native button has no busy state — swap in a matching
          // disabled pill while the identity-token round-trip runs.
          <View
            accessibilityState={{ busy: true }}
            style={{
              minHeight: BUTTON_HEIGHT,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.stroke,
            }}
          >
            <ActivityIndicator color={colors.muted} />
          </View>
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              appleButtonType === "signUp"
                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            // WHITE_OUTLINE = black fill, white logo + text + hairline —
            // Apple's sanctioned treatment for dark UIs.
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
            cornerRadius={999}
            style={{ width: "100%", height: BUTTON_HEIGHT }}
            onPress={onApple}
          />
        )
      ) : null}
      <GoogleButton label={googleLabel} onPress={onGoogle} loading={pending === "google"} />
    </View>
  );
}
