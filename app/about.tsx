import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from "react-native";

const SOURCES = [
  {
    title: "無駄な会議の年間損失試算（パーソル総合研究所）",
    url: "https://rc.persol-group.co.jp/thinktank/column/201812130003.html",
    summary:
      "1万人規模の企業で年間約15億円、1,500人規模でも約2億円の損失が無駄な社内会議から生じると試算されている。",
  },
  {
    title: "会議の良し悪しは「終わらせ方」で決まる",
    url: "https://rc.persol-group.co.jp/thinktank/column/201812130003.html",
    summary:
      "同研究では、会議の質を左右するのは「始め方」よりも「終わらせ方」—— 結論・アクションアイテムが出たか —— だと指摘している。本アプリの採点配点（結論・アクションへの重み付け）はこの知見に基づく。",
  },
  {
    title: "マネジメント層ほど会議をムダと感じる（Diamond Online）",
    url: "https://diamond.jp/articles/-/184723",
    summary:
      "管理職・役員ほど「無駄な会議が多い」と感じており、組織の上位層ほど問題意識が高いことが示されている。",
  },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.introBox}>
        <Text style={styles.introTitle}>なぜこのアプリを作ったか</Text>
        <Text style={styles.introText}>
          日本企業の会議は「長い・多い・決まらない」と言われて久しいです。{"\n\n"}
          このアプリは、会議の録音や文字起こしを渡すだけで発言量の偏りを数値化し、
          AI が辛口で採点します。点数と具体的な指摘を突きつけることで、
          参加者が次の会議を短く・濃くするよう促すことを目的としています。{"\n\n"}
          採点は甘くしません。良かった点を並べるより、無駄・偏り・結論の弱さを率直に指摘します。
        </Text>
      </View>

      <Text style={styles.sectionTitle}>参考データ・出典</Text>

      {SOURCES.map((src, i) => (
        <View key={i} style={styles.sourceCard}>
          <Text style={styles.sourceTitle}>{src.title}</Text>
          <Text style={styles.sourceSummary}>{src.summary}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(src.url)}>
            <Text style={styles.sourceLink}>{src.url}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.scoringBox}>
        <Text style={styles.scoringTitle}>採点の考え方</Text>
        <Text style={styles.scoringText}>
          総合100点からの減点方式で、7つの軸で評価します。{"\n"}
          「結論とアクション」に最も大きな配点（最大-25点）を置いているのは、
          パーソル総研の知見「終わらせ方が会議の質を決める」に基づいています。{"\n\n"}
          各軸の指摘には文字起こしの該当箇所の引用を必ず付けます。
          証拠のない断定はしません。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 16, paddingBottom: 40 },
  introBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
  },
  introTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  introText: { color: "#ccc", fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 12 },
  sourceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sourceTitle: { fontSize: 14, fontWeight: "700", color: "#222", marginBottom: 6 },
  sourceSummary: { fontSize: 13, color: "#555", lineHeight: 20, marginBottom: 8 },
  sourceLink: { fontSize: 12, color: "#3498db", textDecorationLine: "underline" },
  scoringBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  scoringTitle: { fontSize: 15, fontWeight: "700", color: "#e74c3c", marginBottom: 8 },
  scoringText: { fontSize: 13, color: "#444", lineHeight: 21 },
});
