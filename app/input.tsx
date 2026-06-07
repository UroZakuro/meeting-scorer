import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { requestRecordingPermissionsAsync } from "expo-audio";
import { useAudioRecorderCompat } from "../src/lib/useAudioRecorderCompat";
import { parseTranscript, calcSpeakerStats } from "../src/lib/analyze";
import { callEvaluateApi, callTranscribeApi } from "../src/lib/api";
import { useMeetingStore } from "../src/store/useMeetingStore";
import { useEntitlement } from "../src/lib/useEntitlement";
import { MeetingResult, Utterance } from "../src/types";

// expo-audio は ネイティブのみ対応。Web では録音 UI を非表示にする。
// Hook ベースのため条件付き import は使えない。Platform チェックで UI のみ分岐する。

const SAMPLE_TRANSCRIPT = `田中: 先週の件ですが、まだ確認中でして…まあ、来週には報告できると思います。
佐藤: えーと、それって具体的にいつごろになりますか？
田中: そうですね、あの、木曜日くらいには。
鈴木: 承知しました。ところで、別件なんですが、例のプロジェクトについてちょっと相談があります。
佐藤: あー、それはまた今度でいいんじゃないですか。今日は時間ないし。
田中: まあ、そうですね。では次回ということで。
鈴木: 了解です。えーと、あと報告事項なんですが、先月の数字が出ました。前月比でまあ横ばいです。
佐藤: はい。ありがとうございます。
田中: なんか、特に問題ないですかね。じゃあ以上で終わりにしましょう。`;

type Tab = "text" | "audio";

export default function InputScreen() {
  const router = useRouter();
  const addResult = useMeetingStore((s) => s.addResult);
  const { canEvaluate, canSaveNewHistory, incrementEvaluationCount } = useEntitlement();

  const [tab, setTab] = useState<Tab>("text");
  const [transcript, setTranscript] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("AI採点中…");

  // 録音状態
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const audioRecorder = useAudioRecorderCompat();

  function loadSample() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setDurationMinutes("15");
    setParticipantCount("3");
  }

  // ── 録音開始・停止 ──
  async function toggleRecording() {
    if (isRecording) {
      audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordingUri(uri ?? null);
      setSelectedFileName("録音データ.m4a");
      setIsRecording(false);
    } else {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("マイクの許可が必要です", "設定からマイクのアクセスを許可してください");
        return;
      }
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingUri(null);
      setSelectedFileName(null);
    }
  }

  // ── ファイル選択 ──
  async function pickAudioFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a", "audio/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setRecordingUri(result.assets[0].uri);
      setSelectedFileName(result.assets[0].name);
    }
  }

  // ── 文字起こし → 採点 ──
  async function handleAudioAnalyze() {
    if (!recordingUri) {
      Alert.alert("音声が必要です", "録音するかファイルを選択してください");
      return;
    }
    setIsLoading(true);
    setLoadingMsg("文字起こし中…");
    try {
      const text = await callTranscribeApi(recordingUri, selectedFileName ?? "audio.m4a");
      setLoadingMsg("AI採点中…");
      await runEvaluation(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "不明なエラー";
      Alert.alert("エラー", msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ── テキスト → 採点 ──
  async function handleTextAnalyze() {
    if (!transcript.trim()) {
      Alert.alert("入力が必要です", "文字起こしテキストを入力してください");
      return;
    }
    setIsLoading(true);
    setLoadingMsg("AI採点中…");
    try {
      await runEvaluation(transcript);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "不明なエラー";
      Alert.alert("採点に失敗しました", msg + "\n\nバックエンドが起動しているか確認してください。");
    } finally {
      setIsLoading(false);
    }
  }

  async function runEvaluation(text: string) {
    // 回数制限チェック
    if (!canEvaluate) {
      router.push("/paywall");
      return;
    }
    // 履歴保存制限チェック
    if (!canSaveNewHistory) {
      router.push("/paywall");
      return;
    }
    const utterances: Utterance[] = parseTranscript(text);
    const speakerStats = calcSpeakerStats(utterances);
    const duration = durationMinutes ? parseInt(durationMinutes, 10) : null;
    const participants = participantCount ? parseInt(participantCount, 10) : null;

    // 話者不明の発言が多い場合は話者割り当て画面へ
    const unknownRatio =
      utterances.filter((u) => u.speaker === null).length / Math.max(utterances.length, 1);
    if (unknownRatio > 0.5 && utterances.length > 3) {
      // 話者割り当て画面へ遷移（結果はそちらで生成）
      const encoded = encodeURIComponent(text);
      router.push({
        pathname: "/assign-speakers",
        params: { transcript: encoded, durationMinutes: duration ?? "", participantCount: participants ?? "" },
      });
      return;
    }

    const evaluation = await callEvaluateApi({ transcript: text, speakerStats, durationMinutes: duration, participantCount: participants });
    incrementEvaluationCount();
    const result: MeetingResult = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      durationMinutes: duration,
      participantCount: participants,
      speakerStats,
      evaluation,
    };
    addResult(result);
    router.push({ pathname: "/result", params: { id: result.id } });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

      {/* タブ切り替え */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "text" && styles.tabActive]}
          onPress={() => setTab("text")}
        >
          <Text style={[styles.tabText, tab === "text" && styles.tabTextActive]}>テキスト貼り付け</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "audio" && styles.tabActive]}
          onPress={() => setTab("audio")}
        >
          <Text style={[styles.tabText, tab === "audio" && styles.tabTextActive]}>音声入力</Text>
        </TouchableOpacity>
      </View>

      {/* ── テキストタブ ── */}
      {tab === "text" && (
        <>
          <Text style={styles.hint}>
            推奨形式:「話者名: 発言」を1行ずつ。話者名がない場合は全体評価のみになります。
          </Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={12}
            placeholder={"田中: 先週の件ですが…\n佐藤: えーと、それは…"}
            value={transcript}
            onChangeText={setTranscript}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.sampleButton} onPress={loadSample}>
            <Text style={styles.sampleButtonText}>サンプルを読み込む</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── 音声タブ ── */}
      {tab === "audio" && (
        <View style={styles.audioBox}>
          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={toggleRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? "⏹ 録音を停止" : "🎙 録音を開始"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.pickButton} onPress={pickAudioFile}>
            <Text style={styles.pickButtonText}>📁 音声ファイルを選択（m4a / mp3 / wav）</Text>
          </TouchableOpacity>
          {selectedFileName && (
            <View style={styles.fileSelected}>
              <Text style={styles.fileSelectedText}>✓ {selectedFileName}</Text>
            </View>
          )}
          <Text style={styles.audioNote}>
            ※ 文字起こし後、話者が検出されない場合は話者割り当て画面が開きます。
          </Text>
        </View>
      )}

      {/* 共通: 時間・人数入力 */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>所要時間（分）任意</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="例: 30"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>参加人数　　任意</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="例: 5"
            value={participantCount}
            onChangeText={setParticipantCount}
          />
        </View>
      </View>

      <View style={styles.privacyBox}>
        <Text style={styles.privacyText}>
          ⚠ 入力データは採点のために外部APIに一時送信されます。サーバーには保存されません。
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
        onPress={tab === "text" ? handleTextAnalyze : handleAudioAnalyze}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.analyzeButtonText}>{loadingMsg}</Text>
          </View>
        ) : (
          <Text style={styles.analyzeButtonText}>解析してAI採点する</Text>
        )}
      </TouchableOpacity>

      {isLoading && (
        <Text style={styles.loadingHint}>
          {tab === "audio"
            ? "音声を文字起こし後、AIが採点します。少々お待ちください。"
            : "AIが文字起こしを読み込んでいます。10〜30秒ほどかかります。"}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 16, paddingBottom: 40 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: "#888", fontWeight: "600" },
  tabTextActive: { color: "#1a1a2e" },
  hint: { fontSize: 12, color: "#888", marginBottom: 8, lineHeight: 18 },
  textarea: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    fontSize: 14, minHeight: 200, borderWidth: 1, borderColor: "#ddd", color: "#333",
  },
  sampleButton: { alignSelf: "flex-end", marginTop: 6, paddingVertical: 4, paddingHorizontal: 10 },
  sampleButtonText: { fontSize: 13, color: "#3498db", textDecorationLine: "underline" },
  audioBox: { gap: 12, marginBottom: 8 },
  recordButton: {
    backgroundColor: "#e74c3c", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  recordButtonActive: { backgroundColor: "#c0392b" },
  recordButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pickButton: {
    backgroundColor: "#fff", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1.5, borderColor: "#3498db",
  },
  pickButtonText: { color: "#3498db", fontSize: 14, fontWeight: "600" },
  fileSelected: {
    backgroundColor: "#e8f5e9", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  fileSelectedText: { fontSize: 13, color: "#2e7d32" },
  audioNote: { fontSize: 12, color: "#999", lineHeight: 18 },
  row: { flexDirection: "row", gap: 12, marginTop: 16 },
  halfField: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
  input: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    fontSize: 14, borderWidth: 1, borderColor: "#ddd", color: "#333",
  },
  privacyBox: {
    backgroundColor: "#fff8e1", borderRadius: 10, padding: 12,
    marginTop: 20, borderLeftWidth: 3, borderLeftColor: "#f39c12",
  },
  privacyText: { fontSize: 12, color: "#795548", lineHeight: 18 },
  analyzeButton: {
    backgroundColor: "#e74c3c", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 20,
  },
  analyzeButtonDisabled: { backgroundColor: "#aaa" },
  loadingRow: { flexDirection: "row", alignItems: "center" },
  analyzeButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  loadingHint: { textAlign: "center", color: "#888", fontSize: 13, marginTop: 10 },
});
