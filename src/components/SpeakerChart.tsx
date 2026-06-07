/**
 * 話者別発言量グラフ。
 * CSS バー実装（react-native-svg 不使用）でWeb/iOS/Android全対応。
 */
import { View, Text, StyleSheet } from "react-native";
import { SpeakerStat } from "../types";

const COLORS = [
  "#3498db", "#e74c3c", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#e91e63",
];
const WARNING_COLOR = "#e74c3c";

type Props = {
  stats: SpeakerStat[];
  width?: number; // 後方互換のため残す（未使用）
};

export function SpeakerChart({ stats }: Props) {
  if (stats.length === 0) return null;

  const maxChars = stats[0].charCount;

  return (
    <View style={styles.container}>
      {/* 凡例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#3498db" }]} />
          <Text style={styles.legendText}>通常</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: WARNING_COLOR }]} />
          <Text style={styles.legendText}>発言50%超（偏り大）</Text>
        </View>
      </View>

      {/* バーグラフ */}
      {stats.map((stat, i) => {
        const pct = maxChars > 0 ? (stat.charCount / maxChars) * 100 : 0;
        const warn = stat.sharePercent >= 50;
        const color = warn ? WARNING_COLOR : COLORS[i % COLORS.length];
        return (
          <View key={stat.speaker} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {stat.speaker.length > 6 ? stat.speaker.slice(0, 6) + "…" : stat.speaker}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${pct}%` as `${number}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.barPct, { color }]}>{stat.sharePercent}%</Text>
          </View>
        );
      })}

      {/* 詳細テーブル */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.cellWide, styles.headerText]}>話者</Text>
          <Text style={[styles.cell, styles.headerText]}>発言回</Text>
          <Text style={[styles.cell, styles.headerText]}>文字数</Text>
          <Text style={[styles.cell, styles.headerText]}>推定時間</Text>
          <Text style={[styles.cell, styles.headerText]}>フィラー</Text>
        </View>
        {stats.map((s, i) => (
          <View key={s.speaker} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.cell, styles.cellWide]} numberOfLines={1}>{s.speaker}</Text>
            <Text style={styles.cell}>{s.utteranceCount}</Text>
            <Text style={styles.cell}>{s.charCount.toLocaleString()}</Text>
            <Text style={styles.cell}>{s.estimatedMinutes}分</Text>
            <Text style={[styles.cell, s.fillerCount > 5 && styles.fillerWarn]}>
              {s.fillerCount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  legend: { flexDirection: "row", gap: 16, marginBottom: 10, paddingHorizontal: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#666" },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  barLabel: {
    width: 72,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 24,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  barPct: {
    width: 40,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 0,
  },

  table: {
    marginTop: 14,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  tableRowAlt: { backgroundColor: "#fafafa" },
  headerText: { fontWeight: "700", color: "#555" },
  cell: { flex: 1, fontSize: 12, color: "#444", textAlign: "center" },
  cellWide: { flex: 1.6, textAlign: "left" },
  fillerWarn: { color: "#e74c3c", fontWeight: "700" },
});
