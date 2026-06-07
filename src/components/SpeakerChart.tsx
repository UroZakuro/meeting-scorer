/**
 * 話者別発言量の横棒グラフ。
 * react-native-svg を使い Web / iOS / Android 共通で動く。
 */
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { SpeakerStat } from "../types";

const COLORS = [
  "#3498db", "#e74c3c", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#e91e63",
];

const WARNING_COLOR = "#e74c3c";
const BAR_HEIGHT = 28;
const BAR_GAP = 10;
const LABEL_WIDTH = 80;
const PCT_WIDTH = 44;
const CHART_PADDING = 8;

type Props = {
  stats: SpeakerStat[];
  width: number; // 親から渡す（onLayout）
};

export function SpeakerChart({ stats, width }: Props) {
  if (stats.length === 0) return null;

  const barAreaWidth = width - LABEL_WIDTH - PCT_WIDTH - CHART_PADDING * 2;
  const svgHeight = stats.length * (BAR_HEIGHT + BAR_GAP) + CHART_PADDING;
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

      <Svg width={width} height={svgHeight}>
        {stats.map((stat, i) => {
          const y = i * (BAR_HEIGHT + BAR_GAP) + CHART_PADDING / 2;
          const barW = maxChars > 0 ? (stat.charCount / maxChars) * barAreaWidth : 0;
          const color = stat.sharePercent >= 50 ? WARNING_COLOR : COLORS[i % COLORS.length];
          const labelX = LABEL_WIDTH - 4;
          const barX = LABEL_WIDTH;

          return (
            <View key={stat.speaker}>
              {/* 話者名ラベル（SVG内テキスト） */}
              <SvgText
                x={labelX}
                y={y + BAR_HEIGHT / 2 + 5}
                textAnchor="end"
                fontSize={13}
                fill="#333"
                fontWeight="600"
              >
                {stat.speaker.length > 6 ? stat.speaker.slice(0, 6) + "…" : stat.speaker}
              </SvgText>

              {/* 背景バー */}
              <Rect
                x={barX}
                y={y}
                width={barAreaWidth}
                height={BAR_HEIGHT}
                rx={6}
                fill="#eee"
              />

              {/* 実際のバー */}
              <Rect
                x={barX}
                y={y}
                width={Math.max(barW, barW > 0 ? 4 : 0)}
                height={BAR_HEIGHT}
                rx={6}
                fill={color}
              />

              {/* シェア% */}
              <SvgText
                x={barX + barAreaWidth + PCT_WIDTH / 2}
                y={y + BAR_HEIGHT / 2 + 5}
                textAnchor="middle"
                fontSize={13}
                fontWeight="700"
                fill={color}
              >
                {stat.sharePercent}%
              </SvgText>
            </View>
          );
        })}
      </Svg>

      {/* 詳細テーブル */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableCellWide, styles.tableHeaderText]}>話者</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>発言回</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>文字数</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>推定時間</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>フィラー</Text>
        </View>
        {stats.map((s, i) => (
          <View key={s.speaker} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.tableCell, styles.tableCellWide]} numberOfLines={1}>{s.speaker}</Text>
            <Text style={styles.tableCell}>{s.utteranceCount}</Text>
            <Text style={styles.tableCell}>{s.charCount.toLocaleString()}</Text>
            <Text style={styles.tableCell}>{s.estimatedMinutes}分</Text>
            <Text style={[styles.tableCell, s.fillerCount > 5 && styles.fillerWarning]}>
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
  legend: { flexDirection: "row", gap: 16, marginBottom: 8, paddingHorizontal: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#666" },
  table: {
    marginTop: 12,
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
  tableHeaderText: { fontWeight: "700", color: "#555" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  tableRowAlt: { backgroundColor: "#fafafa" },
  tableCell: { flex: 1, fontSize: 12, color: "#444", textAlign: "center" },
  tableCellWide: { flex: 1.6, textAlign: "left" },
  fillerWarning: { color: "#e74c3c", fontWeight: "700" },
});
