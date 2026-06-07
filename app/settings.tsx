import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useEntitlementStore } from "../src/store/useEntitlementStore";
import { useEntitlement } from "../src/lib/useEntitlement";
import { FREE_MONTHLY_EVALUATIONS } from "../src/lib/constants";
import { restorePurchasesMobile } from "../src/lib/purchases";

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium, monthlyEvaluationCount } = useEntitlement();
  const setPremium = useEntitlementStore((s) => s.setPremium);

  async function handleRestore() {
    if (Platform.OS === "web") {
      Alert.alert("Web版の復元", "Web版の購入状態はStripeダッシュボードから確認できます。");
      return;
    }
    const restored = await restorePurchasesMobile();
    if (restored) {
      Alert.alert("復元完了", "購入が復元されました");
    } else {
      Alert.alert("復元できませんでした", "有効なサブスクリプションが見つかりませんでした");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* プラン状態 */}
      <View style={styles.planBox}>
        <Text style={styles.planLabel}>現在のプラン</Text>
        <View style={[styles.planBadge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
          <Text style={styles.planBadgeText}>{isPremium ? "⚡ プレミアム" : "無料プラン"}</Text>
        </View>
        {!isPremium && (
          <Text style={styles.planCount}>
            今月の採点: {monthlyEvaluationCount} / {FREE_MONTHLY_EVALUATIONS}回
          </Text>
        )}
      </View>

      {/* アップグレード */}
      {!isPremium && (
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push("/paywall")}>
          <Text style={styles.upgradeBtnText}>プレミアムにアップグレード</Text>
        </TouchableOpacity>
      )}

      {/* 復元ボタン */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleRestore}>
          <Text style={styles.rowText}>購入を復元する</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* リンク */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/about")}
        >
          <Text style={styles.rowText}>このアプリについて</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL("https://example.com/privacy")}
        >
          <Text style={styles.rowText}>プライバシーポリシー</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 開発用: プレミアムトグル */}
      {__DEV__ && (
        <View style={styles.devBox}>
          <Text style={styles.devLabel}>DEV: プレミアム強制切り替え</Text>
          <TouchableOpacity
            style={[styles.devBtn, isPremium && styles.devBtnActive]}
            onPress={() => setPremium(!isPremium)}
          >
            <Text style={styles.devBtnText}>{isPremium ? "→ 無料に戻す" : "→ プレミアムにする"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 16, paddingBottom: 40 },
  planBox: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18,
    marginBottom: 14, alignItems: "center", gap: 8,
  },
  planLabel: { fontSize: 13, color: "#888" },
  planBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  freeBadge: { backgroundColor: "#eee" },
  premiumBadge: { backgroundColor: "#e74c3c" },
  planBadgeText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  planCount: { fontSize: 13, color: "#888" },
  upgradeBtn: {
    backgroundColor: "#e74c3c", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginBottom: 20,
  },
  upgradeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  section: {
    backgroundColor: "#fff", borderRadius: 12, marginBottom: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  rowText: { fontSize: 15, color: "#333" },
  rowArrow: { fontSize: 20, color: "#ccc" },
  devBox: {
    marginTop: 20, backgroundColor: "#fff3e0", borderRadius: 12,
    padding: 14, gap: 8,
  },
  devLabel: { fontSize: 12, color: "#e67e22", fontWeight: "700" },
  devBtn: {
    backgroundColor: "#e67e22", borderRadius: 8,
    paddingVertical: 8, alignItems: "center",
  },
  devBtnActive: { backgroundColor: "#27ae60" },
  devBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
