/**
 * 話者割り当て画面
 * 文字起こしに話者名が含まれていない場合、各発言ブロックに手動で名前を付ける。
 */
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parseTranscript, calcSpeakerStats } from "../src/lib/analyze";
import { callEvaluateApi } from "../src/lib/api";
import { useMeetingStore } from "../src/store/useMeetingStore";
import { MeetingResult } from "../src/types";

export default function AssignSpeakersScreen() {
  const router = useRouter();
  const addResult = useMeetingStore((s) => s.addResult);
  const params = useLocalSearchParams<{
    transcript: string;
    durationMinutes: string;
    participantCount: string;
  }>();

  const rawTranscript = decodeURIComponent(params.transcript ?? "");
  const rawLines = rawTranscript.split("\n").map((l) => l.trim()).filter(Boolean);

  // 各行の割り当て話者名
  const [speakerNames, setSpeakerNames] = useState<string[]>(rawLines.map(() => ""));
  const [isLoading, setIsLoading] = useState(false);

  // よく使う名前の候補（入力した名前を記憶）
  const usedNames = Array.from(new Set(speakerNames.filter(Boolean)));

  function setName(index: number, name: string) {
    setSpeakerNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }

  function applyNameToAll(index: number) {
    const name = speakerNames[index];
    if (!name) return;
    setSpeakerNames((prev) => prev.map((n) => (n === "" ? name : n)));
  }

  async function handleSubmit() {
    const unnamed = speakerNames.filter((n) => !n.trim()).length;
    if (unnamed > 0) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          `${unnamed}行が未割り当てです`,
          "未割り当ての発言は「不明」として処理されます。続けますか？",
          [
            { text: "戻って入力する", onPress: () => resolve(false) },
            { text: "続ける", onPress: () => resolve(true) },
          ]
        );
      });
      if (!proceed) return;
    }

    // 話者名を付けた文字起こしを再構成
    const rebuiltTranscript = rawLines
      .map((line, i) => {
        const name = speakerNames[i]?.trim() || "不明";
        // すでに「話者名:」形式の行はそのまま
        const hasPrefix = /^[^\s:：]{1,20}[：:]/.test(line);
        return hasPrefix ? line : `${name}: ${line}`;
      })
      .join("\n");

    setIsLoading(true);
    try {
      const utterances = parseTranscript(rebuiltTranscript);
      const speakerStats = calcSpeakerStats(utterances);
      const duration = params.durationMinutes ? parseInt(params.durationMinutes, 10) : null;
      const participants = params.participantCount ? parseInt(params.participantCount, 10) : null;

      const evaluation = await callEvaluateApi({
        transcript: rebuiltTranscript,
        speakerStats,
        durationMinutes: duration,
        participantCount: participants,
      });

      const result: MeetingResult = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        durationMinutes: duration,
        participantCount: participants,
        speakerStats,
        evaluation,
      };

      addResult(result);
      router.replace({ pathname: "/result", params: { id: result.id } });
    } catch (e) {
      Alert.alert("エラー", e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>話者を割り当ててください</Text>
        <Text style={styles.headerSub}>
          各発言の左に話者名を入力してください。「全員に適用」で空欄をまとめて埋められます。
        </Text>
        {usedNames.length > 0 && (
          <View style={styles.usedNames}>
            <Text style={styles.usedNamesLabel}>使用中の名前:</Text>
            {usedNames.map((n) => (
              <View key={n} style={styles.nameBadge}>
                <Text style={styles.nameBadgeText}>{n}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {rawLines.map((line, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.nameInputWrap}>
              <TextInput
                style={styles.nameInput}
                placeholder="名前"
                value={speakerNames[i]}
                onChangeText={(v) => setName(i, v)}
                returnKeyType="next"
              />
              {speakerNames[i] ? (
                <TouchableOpacity style={styles.applyBtn} onPress={() => applyNameToAll(i)}>
                  <Text style={styles.applyBtnText}>全員</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.utteranceText} numberOfLines={2}>{line}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>AI採点中…</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>割り当てて採点する</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#1a1a2e", padding: 16,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  headerSub: { color: "#aaa", fontSize: 13, lineHeight: 18 },
  usedNames: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8, gap: 6 },
  usedNamesLabel: { color: "#888", fontSize: 12 },
  nameBadge: {
    backgroundColor: "#2c3e50", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  nameBadgeText: { color: "#fff", fontSize: 12 },
  scroll: { padding: 12, paddingBottom: 100 },
  row: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
  },
  nameInputWrap: { width: 100, flexDirection: "row", alignItems: "center", gap: 4 },
  nameInput: {
    flex: 1, backgroundColor: "#f0f0f0", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: "#222",
  },
  applyBtn: {
    backgroundColor: "#3498db", borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 4,
  },
  applyBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  utteranceText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 19 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", padding: 16,
    borderTopWidth: 1, borderTopColor: "#eee",
  },
  submitBtn: {
    backgroundColor: "#e74c3c", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#aaa" },
  loadingRow: { flexDirection: "row", alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
