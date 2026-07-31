// Expo Push API'ye toplu gönderim. Expo tek istekte en fazla 100 mesaj kabul
// ediyor, bu yüzden burada 100'lük parçalara bölünüyor.
// bkz. https://docs.expo.dev/push-notifications/sending-notifications/

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export async function sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (!response.ok) {
        console.error("sendExpoPushNotifications: chunk failed", await response.text());
      }
    } catch (error) {
      console.error("sendExpoPushNotifications: fetch error", error);
    }
  }
}
