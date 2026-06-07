import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Pressable, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useMeetingStore } from "../src/store/useMeetingStore";
import { MeetingResult } from "../src/types";
import { AdBanner } from "../src/components/AdBanner";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#27ae60" : score >= 50 ? "#e67e22" : "#e74c3c";
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{score}</Text>
      <Text style={styles.badgeUnit}>点</Text>
    </View>
  );
}

function HistoryCard({
  result,
  onPress,
  onDelete,
}: {
  result: MeetingResult;
  onPress: () => void;
  onDelete: () => void;
}) {
  const date = new Date(result.createdAt).toLocaleDateString("ja-JP", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const speakerCount = result.speakerStats.filter((s) => s.speaker !== "（不明）").length;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <ScoreBadge score={result.evaluation.overallScore} />
      <View style={styles.cardBody}>
        <Text style={styles.cardVerdict} numberOfLines={2}>
          {result.evaluation.oneLineVerdict}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>{date}</Text>
          {speakerCount > 0 && (
            <Text style={styles.cardMetaText}>{speakerCount}名</Text>
          )}
          {result.durationMinutes && (
            <Text style={styles.cardMetaText}>{result.durationMinutes}分</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const history = useMeetingStore((s) => s.history);
  const removeResult = useMeetingStore((s) => s.removeResult);
  const clearHistory = useMeetingStore((s) => s.clearHistory);

  function handleDelete(id: string) {
    Alert.alert("削除しますか？", "この採点結果を削除します。", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => removeResult(id) },
    ]);
  }

  function handleClearAll() {
    Alert.alert("全件削除しますか？", "すべての採点履歴を削除します。", [
      { text: "キャンセル", style: "cancel" },
      { text: "全件削除", style: "destructive", onPress: clearHistory },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ヒーローバナー */}
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>会議辛口採点</Text>
          <Text style={styles.heroSub}>
            文字起こしを貼るだけで、会議の無駄を数値化・辛口評価します
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={() => router.push("/input")}>
            <Text style={styles.startButtonText}>＋ 新規採点を始める</Text>
          </TouchableOpacity>
        </View>

        {/* 採点履歴 */}
        {history.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>過去の採点（{history.length}件）</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>全件削除</Text>
              </TouchableOpacity>
            </View>
            {history.map((r) => (
              <HistoryCard
                key={r.id}
                result={r}
                onPress={() => router.push({ pathname: "/result", params: { id: r.id } })}
                onDelete={() => handleDelete(r.id)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              まだ採点がありません{"\n"}上のボタンから始めましょう
            </Text>
          </View>
        )}
      </ScrollView>

      <AdBanner style={styles.adBanner} />

      <TouchableOpacity style={styles.aboutLink} onPress={() => router.push("/about")}>
        <Text style={styles.aboutLinkText}>このアプリについて</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 16, paddingBottom: 80 },
  heroBox: {
    backgroundColor: "#1a1a2e", borderRadius: 16,
    padding: 24, marginBottom: 24, alignItems: "center",
  },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  heroSub: {
    color: "#aaa", fontSize: 13, textAlign: "center",
    marginBottom: 20, lineHeight: 20,
  },
  startButton: {
    backgroundColor: "#e74c3c", borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  startButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  clearAllText: { fontSize: 13, color: "#e74c3c" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  badge: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center", marginRight: 14,
    flexShrink: 0,
  },
  badgeText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  badgeUnit: { color: "#fff", fontSize: 10, marginTop: -4 },
  cardBody: { flex: 1, marginRight: 6 },
  cardVerdict: { fontSize: 14, color: "#333", lineHeight: 20 },
  cardMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  cardMetaText: { fontSize: 12, color: "#999" },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14, color: "#ccc" },
  emptyBox: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: "#aaa", fontSize: 15, textAlign: "center", lineHeight: 26 },
  adBanner: { position: "absolute", bottom: 36, left: 0, right: 0 },
  aboutLink: { position: "absolute", bottom: 16, alignSelf: "center" },
  aboutLinkText: { color: "#888", fontSize: 13, textDecorationLine: "underline" },
});
