import { useRef, useState } from "react";
import { View, Text, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { updatePassword, authErrorKey } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { TextField } from "../../src/components/ui/TextField";
import { Button } from "../../src/components/ui/Button";
import { AuthScaffold } from "../../src/components/auth/AuthScaffold";

const MIN_PASSWORD = 6;

// Reached only from a recovery deep link — useAuthListener flags
// passwordRecovery, the route guard keeps this (recovery) session here rather
// than dropping it into the app, and setting the password clears the flag.
export default function ResetPasswordScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const confirmRef = useRef<TextInput>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(t("error.weakPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(t(authErrorKey(err)));
      return;
    }
    useUserStore.getState().setPasswordRecovery(false);
    router.replace("/(tabs)");
  }

  return (
    <AuthScaffold eyebrow={t("reset.eyebrow")} title={t("reset.title")}>
      <View style={{ gap: 14 }}>
        <Text style={{ fontSize: 13, lineHeight: 20, color: colors.muted }}>{t("reset.body")}</Text>

        <TextField
          kind="newPassword"
          label={t("field.newPassword")}
          placeholder={t("field.newPasswordPlaceholder", { count: MIN_PASSWORD })}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={confirmRef}
          kind="newPassword"
          label={t("reset.confirmLabel")}
          placeholder={t("reset.confirmPlaceholder")}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            if (error) setError(null);
          }}
          error={error}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <Button label={t("reset.submit")} onPress={handleSubmit} loading={loading} />
      </View>
    </AuthScaffold>
  );
}
