import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Dock } from "../../src/components/Dock";

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <Dock {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home:tabTitle") }} />
      <Tabs.Screen name="mixer" options={{ title: t("mixer:tabTitle") }} />
      <Tabs.Screen name="sleep" options={{ title: t("sleep:tabTitle") }} />
      <Tabs.Screen name="profile" options={{ title: t("settings:tabTitle") }} />
    </Tabs>
  );
}
