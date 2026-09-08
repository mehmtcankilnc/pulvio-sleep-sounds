import { View } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Dock } from "../../src/components/Dock";
import { CooldownBanner } from "../../src/components/CooldownBanner";

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <CooldownBanner />
      <Tabs
        tabBar={(props) => <Dock {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t("home:tabTitle") }} />
        <Tabs.Screen name="sleep" options={{ title: t("sleep:tabTitle") }} />
        <Tabs.Screen name="profile" options={{ title: t("settings:tabTitle") }} />
      </Tabs>
    </View>
  );
}
