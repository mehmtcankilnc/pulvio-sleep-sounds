import { Linking, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./ui/Button";
import { useAppUpdate } from "../hooks/useAppUpdate";
import { useThemeColors } from "../hooks/useThemeColors";

// "Yeni sürüm + yeni sesler hazır" uyarısı. İçerik güncellemeleri artık
// sunucudan geldiği için bu sheet'in asıl işi: yeni istemci özelliği olan bir
// sürüm çıktığında (ve min_version yükseltildiğinde) kullanıcıyı mağazaya
// yönlendirmek.
export function UpdatePrompt({ enabled }: { enabled: boolean }) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { update, dismiss } = useAppUpdate(enabled);

  const required = update?.required ?? false;
  const storeUrl = update?.config.storeUrl ?? null;
  // Mağaza linki yoksa (ör. iOS id'si henüz girilmedi) buton işe yaramaz — gösterme.
  const visible = !!update && !!storeUrl;
  const serverBody = update?.config.message?.[i18n.language] ?? update?.config.message?.en;

  return (
    <BottomSheet
      visible={visible}
      onClose={required ? () => {} : dismiss}
      style={{ borderWidth: 1, borderColor: colors.stroke, padding: 20, gap: 16 }}
    >
      <View style={{ gap: 6 }} accessible accessibilityLiveRegion="polite">
        <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
          {required ? t("updateRequiredTitle") : t("updateTitle")}
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>
          {serverBody ?? (required ? t("updateRequiredBody") : t("updateBody"))}
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Button label={t("updateAction")} onPress={() => storeUrl && Linking.openURL(storeUrl).catch(() => {})} />
        {required ? null : <Button label={t("notNow")} variant="outline" onPress={dismiss} />}
      </View>
    </BottomSheet>
  );
}
