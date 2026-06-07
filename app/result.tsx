import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from "react-native";
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMeetingStore } from "../src/store/useMeetingStore";
import { AxisResult } from "../src/types";
import { SpeakerChart } from "../src/components/SpeakerChart";
import { AdBanner } from "../src/components/AdBanner";
import { useInterstitialAd } from "../src/lib/useInterstitialAd";

// ─── 共通パーツ ────────────────────────────────────────────

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 70 ? "#27ae60" : score >= 50 ? "#e67e22" : "#e74c3c";
  const label = score >= 70 ? "普通" : score >= 50 ? "問題あり" : "要改善";
  return (
    <View style={[styles.scoreMeter, { borderColor: color }]}>
      <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
      <Text style={styles.scoreUnit}>/ 100点</Text>
      <View style={[styles.scoreLabelBadge, { backgroundColor: color }]}>
        <Text style={styles.scoreLabelText}>{label}</Text>
      </View>
    </View>
  );
}


function AxisCard({ axis }: { axis: AxisResult }) {
  const AXIS_MAX: Record<number, number> = { 1: 20, 2: 25, 3: 15, 4: 10, 5: 10, 6: 10, 7: 10 };
  const max = AXIS_MAX[axis.id] ?? 10;
  const ratio = axis.deduction / max;
  const color = ratio >= 0.7 ? "#e74c3c" : ratio >= 0.4 ? "#e67e22" : "#27ae60";
  return (
    <View style={styles.axisCard}>
      <View style={styles.axisHeader}>
        <Text style={styles.axisName}>{axis.name}</Text>
        <View style={[styles.deductionBadge, { backgroundColor: color }]}>
          <Text style={styles.deductionText}>-{axis.deduction}点</Text>
        </View>
      </View>
      <Text style={styles.axisComment}>{axis.comment}</Text>
      {axis.evidenceQuote ? (
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>「{axis.evidenceQuote}」</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── メイン画面 ────────────────────────────────────────────

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const history = useMeetingStore((s) => s.history);
  const result = history.find((r) => r.id === id);

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>結果が見つかりません</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/")}>
          <Text style={styles.backBtnText}>ホームへ戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { speakerStats, durationMinutes, participantCount, evaluation } = result;
  const { overallScore, oneLineVerdict, wasMeetingNecessary,
          couldHaveBeenShortenedMinutes, axes, improvements } = evaluation;

  const { maybeShow } = useInterstitialAd();
  useEffect(() => { maybeShow(); }, []);

  const hasSpeakers = speakerStats.some((s) => s.speaker !== "（不明）");
  const topShare = speakerStats[0]?.sharePercent ?? 0;
  const totalDeduction = axes.reduce((s, a) => s + a.deduction, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* ── 総合スコア ── */}
      <View style={styles.section}>
        <ScoreMeter score={overallScore} />
        <Text style={styles.verdict}>{oneLineVerdict}</Text>
      </View>

      {/* ── 会議の要否 ── */}
      <View style={[
        styles.necessityBox,
        { borderLeftColor: wasMeetingNecessary.necessary ? "#27ae60" : "#e74c3c" },
      ]}>
        <Text style={styles.necessityTitle}>
          この会議は{wasMeetingNecessary.necessary ? "必要でした" : "メール/チャットで代替できました"}
        </Text>
        <Text style={styles.necessityReason}>{wasMeetingNecessary.reason}</Text>
      </View>

      {/* ── 短縮可能時間 ── */}
      {couldHaveBeenShortenedMinutes > 0 && (
        <View style={styles.shortenBox}>
          <Text style={styles.shortenText}>
            ⏱ 約 <Text style={styles.shortenNum}>{couldHaveBeenShortenedMinutes}分</Text> 短縮できました
          </Text>
        </View>
      )}

      {/* ── メタ情報 ── */}
      <View style={styles.metaRow}>
        {durationMinutes != null && <Text style={styles.metaChip}>所要 {durationMinutes}分</Text>}
        {participantCount != null && <Text style={styles.metaChip}>{participantCount}名参加</Text>}
        <Text style={styles.metaChip}>合計減点 -{totalDeduction}点</Text>
      </View>

      {/* ── 発言量グラフ ── */}
      {hasSpeakers && (
        <>
          <Text style={styles.sectionTitle}>発言量（話者別）</Text>
          {topShare >= 60 && (
            <View style={styles.warnBox}>
              <Text style={styles.warnText}>
                ⚠ 「{speakerStats[0]?.speaker}」が発言の{topShare}%を占めています
              </Text>
            </View>
          )}
          <View style={styles.chartCard}>
            <SpeakerChart stats={speakerStats} />
          </View>
        </>
      )}

      {/* ── 評価軸ごとの採点 ── */}
      {axes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>評価軸ごとの採点</Text>
          {axes.map((a) => (
            <AxisCard key={a.id} axis={a} />
          ))}
        </>
      )}

      {/* ── 改善アクション ── */}
      {improvements.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>次回への改善アクション</Text>
          <View style={styles.improvementsBox}>
            {improvements.map((imp, i) => (
              <View key={i} style={styles.improvementRow}>
                <Text style={styles.improvementNum}>{i + 1}</Text>
                <Text style={styles.improvementText}>{imp}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/")}>
        <Text style={styles.homeBtnText}>ホームへ戻る</Text>
      </TouchableOpacity>

      <AdBanner />
    </ScrollView>
  );
}

// ─── スタイル ────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#999", fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: "#3498db", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  // スコアメーター
  section: { alignItems: "center", marginBottom: 20 },
  scoreMeter: {
    alignItems: "center",
    borderWidth: 4,
    borderRadius: 100,
    width: 140,
    height: 140,
    justifyContent: "center",
    marginBottom: 12,
  },
  scoreNumber: { fontSize: 52, fontWeight: "900", lineHeight: 56 },
  scoreUnit: { fontSize: 13, color: "#888", marginTop: -4 },
  scoreLabelBadge: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
  },
  scoreLabelText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  verdict: {
    fontSize: 15, color: "#333", textAlign: "center",
    lineHeight: 22, fontWeight: "500", paddingHorizontal: 8,
  },

  // 必要性
  necessityBox: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 10, borderLeftWidth: 4,
  },
  necessityTitle: { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 4 },
  necessityReason: { fontSize: 13, color: "#555", lineHeight: 20 },

  // 短縮
  shortenBox: {
    backgroundColor: "#fff3e0", borderRadius: 10, padding: 12,
    marginBottom: 10, alignItems: "center",
  },
  shortenText: { fontSize: 14, color: "#e67e22" },
  shortenNum: { fontSize: 20, fontWeight: "800" },

  // メタ
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  metaChip: {
    fontSize: 12, color: "#555", backgroundColor: "#e8e8e8",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#222", marginBottom: 10, marginTop: 6 },

  // 発言量
  warnBox: {
    backgroundColor: "#fff3cd", borderRadius: 10, padding: 10, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: "#e67e22",
  },
  warnText: { fontSize: 13, color: "#7d4c00" },
  chartCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
  },

  // 評価軸
  axisCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 8, elevation: 1, shadowColor: "#000",
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  axisHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  axisName: { fontSize: 14, fontWeight: "700", color: "#222", flex: 1 },
  deductionBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  deductionText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  axisComment: { fontSize: 13, color: "#444", lineHeight: 20 },
  quoteBox: {
    backgroundColor: "#f8f8f8", borderRadius: 8, padding: 8,
    marginTop: 8, borderLeftWidth: 3, borderLeftColor: "#bbb",
  },
  quoteText: { fontSize: 12, color: "#666", fontStyle: "italic", lineHeight: 18 },

  // 改善アクション
  improvementsBox: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 20, elevation: 1, shadowColor: "#000",
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  improvementRow: { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },
  improvementNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#e74c3c", color: "#fff",
    fontSize: 12, fontWeight: "700",
    textAlign: "center", lineHeight: 22,
    marginRight: 10, flexShrink: 0,
  },
  improvementText: { fontSize: 14, color: "#333", lineHeight: 20, flex: 1 },

  homeBtn: {
    backgroundColor: "#1a1a2e", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  homeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
