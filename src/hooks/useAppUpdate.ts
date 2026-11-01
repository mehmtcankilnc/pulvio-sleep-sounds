import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import Constants from "expo-constants";
import {
  compareVersions,
  fetchAppConfig,
  getDismissedVersion,
  rememberDismissedVersion,
  type AppConfig,
} from "../lib/appUpdate";

const RECHECK_MS = 6 * 60 * 60 * 1000;

export type AppUpdateState = {
  config: AppConfig;
  // true: yüklü sürüm min_version'ın altında — kapatılamaz.
  required: boolean;
};

// `enabled` false iken (onboarding/giriş akışı) hiçbir şey göstermez ve
// ağa gitmez. Opsiyonel uyarı, kullanıcı o latest_version için "Daha sonra"
// dediyse bir daha çıkmaz; daha yeni bir sürüm duyurulunca yeniden çıkar.
export function useAppUpdate(enabled: boolean) {
  const [state, setState] = useState<AppUpdateState | null>(null);
  const lastCheck = useRef(0);
  const installed = Constants.expoConfig?.version ?? "0.0.0";

  const check = useCallback(async () => {
    lastCheck.current = Date.now();
    try {
      const config = await fetchAppConfig();
      if (!config) return;
      if (compareVersions(installed, config.minVersion) < 0) {
        setState({ config, required: true });
        return;
      }
      if (compareVersions(installed, config.latestVersion) < 0) {
        const dismissed = await getDismissedVersion();
        if (dismissed !== config.latestVersion) setState({ config, required: false });
      }
    } catch {
      // Sürüm kontrolü asla uygulamayı etkilememeli.
    }
  }, [installed]);

  useEffect(() => {
    if (!enabled) return;
    void check();
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active" && Date.now() - lastCheck.current > RECHECK_MS) void check();
    });
    return () => sub.remove();
  }, [enabled, check]);

  const dismiss = useCallback(() => {
    setState((current) => {
      if (current && !current.required) rememberDismissedVersion(current.config.latestVersion);
      return current?.required ? current : null;
    });
  }, []);

  return { update: state, dismiss };
}
