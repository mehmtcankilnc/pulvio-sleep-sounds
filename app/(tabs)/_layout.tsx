import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: t("discover:tabTitle") }} />
      <Tabs.Screen name="player" options={{ title: t("player:tabTitle") }} />
      <Tabs.Screen name="settings" options={{ title: t("settings:tabTitle") }} />
    </Tabs>
  );
}
