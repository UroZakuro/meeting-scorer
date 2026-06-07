import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator, Linking,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useEntitlementStore } from "../src/store/useEntitlementStore";
import {
  FREE_MONTHLY_EVALUATIONS, FREE_MAX_HISTORY,
  PRICE_MONTHLY_JPY, PRICE_YEARLY_JPY,
} from "../src/lib/constants";
import {
  purchaseMobile, restorePurchasesMobile, createStripeCheckout,
} from "../src/lib/purchases";

const FEATURES = [
  { free: `月${FREE_MONTHLY_EVALUATIONS}回まで`, premium: "無制限", label: "採点回数" },
  { free: `直近${FREE_MAX_HISTORY}件`, premium: "無制限", label: "履歴保存" },
  { free: "表示あり", premium: "完全非表示", label: "広告" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubscribe(plan: "monthly" | "yearly") {
    setIsLoading(true);
    try {
      if (Platform.OS === "web") {
        const url = await createStripeCheckout(plan);
        await Linking.openURL(url);
      } else {
        await purchaseMobile(plan);
        router.back();
      }
    } catch (e) {
      Alert.alert("購入エラー", e instanceof Error ? e.message : "購入に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRestore() {
    setIsLoading(true);
    try {
      const restored = await restorePurchasesMobile();
      if (restored) {
        Alert.alert("復元完了", "購入が復元されました");
        router.back();
      } else {
        Alert.alert("復元できませんでした", "有効なサブスクリプションが見つかりませんでした");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const yearlyMonthly = Math.round(PRICE_YEARLY_JPY / 12);
  const yearlySaving = Math.round((1 - PRICE_YEARLY_JPY / (PRICE_MONTHLY_JPY * 12)) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.heroBox}>
        <Text style={styles.heroEmoji}>⚡</Text>
        <Text style={styles.heroTitle}>プレミアムプランにアップグレード</Text>
        <Text style={styles.heroSub}>
          採点回数の制限をなくし、広告なしで使い続けられます
        </Text>
      </View>

      {/* 機能比較表 */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableCellWide]} />
          <Text style={[styles.tableCell, styles.tableHeaderText]}>無料</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText, styles.premiumCol]}>プレミアム</Text>
        </View>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableCellWide, styles.featureLabel]}>{f.label}</Text>
            <Text style={[styles.tableCell, styles.freeText]}>{f.free}</Text>
            <Text style={[styles.tableCell, styles.premiumText, styles.premiumCol]}>{f.premium}</Text>
          </View>
        ))}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      )}

      {/* 月額プラン */}
      <TouchableOpacity style={styles.planCard} onPress={() => handleSubscribe("monthly")} disabled={isLoading}>
        <View>
          <Text style={styles.planTitle}>月額プラン</Text>
          <Text style={styles.planPrice}>¥{PRICE_MONTHLY_JPY.toLocaleString()} / 月</Text>
        </View>
        <View style={styles.planArrow}>
          <Text style={styles.planArrowText}>→</Text>
        </View>
      </TouchableOpacity>

      {/* 年額プラン */}
      <TouchableOpacity style={[styles.planCard, styles.planCardPrimary]} onPress={() => handleSubscribe("yearly")} disabled={isLoading}>
        <View style={styles.savingBadge}>
          <Text style={styles.savingBadgeText}>{yearlySaving}% お得</Text>
        </View>
        <View>
          <Text style={[styles.planTitle, styles.planTitleWhite]}>年額プラン</Text>
          <Text style={[styles.planPrice, styles.planPriceWhite]}>
            ¥{PRICE_YEARLY_JPY.toLocaleString()} / 年
          </Text>
          <Text style={styles.planPriceNote}>（月あたり ¥{yearlyMonthly}）</Text>
        </View>
        <View style={styles.planArrow}>
          <Text style={[styles.planArrowText, { color: "#fff" }]}>→</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        • 自動更新サブスクリプションです。{"\n"}
        • 更新日の24時間前までにキャンセルできます。{"\n"}
        • iOS: App Store アカウントに請求されます。{"\n"}
        • Android: Google Play アカウントに請求されます。
      </Text>

      <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
        <Text style={styles.restoreBtnText}>購入を復元する</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>今は無料版を使う</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 20, paddingBottom: 48 },
  heroBox: { alignItems: "center", marginBottom: 28 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#1a1a2e", textAlign: "center", marginBottom: 8 },
  heroSub: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  table: {
    backgroundColor: "#fff", borderRadius: 12, overflow: "hidden",
    marginBottom: 20, borderWidth: 1, borderColor: "#eee",
  },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8f8f8", paddingVertical: 8, paddingHorizontal: 12 },
  tableHeaderText: { fontWeight: "700", color: "#555", textAlign: "center" },
  tableRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  tableCell: { flex: 1, fontSize: 13, textAlign: "center", color: "#555" },
  tableCellWide: { flex: 1.4, textAlign: "left" },
  featureLabel: { fontWeight: "600", color: "#333" },
  freeText: { color: "#999" },
  premiumText: { fontWeight: "700", color: "#e74c3c" },
  premiumCol: { color: "#e74c3c" },
  planCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18,
    marginBottom: 12, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderWidth: 1.5, borderColor: "#ddd",
  },
  planCardPrimary: { backgroundColor: "#e74c3c", borderColor: "#e74c3c" },
  planTitle: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 4 },
  planTitleWhite: { color: "#fff" },
  planPrice: { fontSize: 22, fontWeight: "800", color: "#1a1a2e" },
  planPriceWhite: { color: "#fff" },
  planPriceNote: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  planArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.08)", alignItems: "center", justifyContent: "center" },
  planArrowText: { fontSize: 16, color: "#555" },
  loadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)", zIndex: 10,
  },
  savingBadge: {
    position: "absolute", top: -10, right: 16,
    backgroundColor: "#f39c12", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  savingBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  disclaimer: { fontSize: 12, color: "#999", lineHeight: 20, marginBottom: 16 },
  restoreBtn: { alignItems: "center", paddingVertical: 12, marginBottom: 8 },
  restoreBtnText: { color: "#3498db", fontSize: 14, textDecorationLine: "underline" },
  closeBtn: { alignItems: "center", paddingVertical: 8 },
  closeBtnText: { color: "#aaa", fontSize: 13 },
});
