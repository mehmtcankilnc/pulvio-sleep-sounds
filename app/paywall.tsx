import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { getCurrentOffering, purchasePackage } from "../src/lib/revenuecat";
import { fetchUserStatus } from "../src/lib/playback";
import { useUserStore } from "../src/store/useUserStore";

export default function PaywallScreen() {
  const router = useRouter();
  const setSubscriptionStatus = useUserStore((state) => state.setSubscriptionStatus);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentOffering()
      .then(setOffering)
      .catch(() => setError("Abonelik seçenekleri yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  async function handlePurchase(pkg: PurchasesPackage) {
    setPurchasing(true);
    setError(null);
    try {
      await purchasePackage(pkg);

      // Webhook'un subscriptions'ı güncellemesi birkaç saniye sürebilir.
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const status = await fetchUserStatus();
        if (status?.plan === "premium") {
          setSubscriptionStatus("premium");
          setCooldownEndsAt(null);
          router.back();
          return;
        }
      }

      Alert.alert("İşlem alındı", "Ödemen alındı, birkaç dakika içinde premium aktif olacak.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satın alma tamamlanamadı");
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!offering || offering.availablePackages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center">Şu an satın alınabilir bir abonelik yok</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold text-center mb-2">Pulvio Premium</Text>
      <Text className="text-gray-500 text-center mb-8">
        Sınırsız dinleme, cooldown yok, tüm sesler açık
      </Text>

      {error && <Text className="text-red-600 text-center mb-4">{error}</Text>}

      {offering.availablePackages.map((pkg) => (
        <Pressable
          key={pkg.identifier}
          className="border border-gray-300 rounded-lg py-4 items-center mb-3"
          onPress={() => handlePurchase(pkg)}
          disabled={purchasing}
        >
          <Text className="font-semibold">{pkg.product.title}</Text>
          <Text className="text-gray-500">{pkg.product.priceString}</Text>
        </Pressable>
      ))}

      {purchasing && <ActivityIndicator className="mt-4" />}
    </View>
  );
}
