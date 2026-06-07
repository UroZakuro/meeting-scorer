import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";

function SettingsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push("/settings")} style={{ paddingRight: 4 }}>
      <Text style={{ color: "#fff", fontSize: 22 }}>⚙</Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#f5f5f5" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "会議辛口採点", headerRight: () => <SettingsButton /> }}
        />
        <Stack.Screen name="input" options={{ title: "新規採点" }} />
        <Stack.Screen name="assign-speakers" options={{ title: "話者の割り当て" }} />
        <Stack.Screen name="result" options={{ title: "採点結果" }} />
        <Stack.Screen name="about" options={{ title: "このアプリについて" }} />
        <Stack.Screen name="paywall" options={{ title: "プレミアムプラン", presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ title: "設定" }} />
      </Stack>
    </>
  );
}
