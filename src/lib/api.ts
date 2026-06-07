import { SpeakerStat, Evaluation } from "../types";

// ローカル開発: バックエンドは localhost:3001
// 本番デプロイ後はここを差し替える
const BACKEND_URL = "http://localhost:3001";

export async function callTranscribeApi(audioUri: string, filename: string): Promise<string> {
  const formData = new FormData();
  // React Native では uri から Blob を作る
  const blob = { uri: audioUri, type: "audio/mpeg", name: filename } as unknown as Blob;
  formData.append("audio", blob);

  const res = await fetch(`${BACKEND_URL}/api/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "不明なエラー" }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return (data as { transcript: string }).transcript;
}

export async function callEvaluateApi(params: {
  transcript: string;
  speakerStats: SpeakerStat[];
  durationMinutes: number | null;
  participantCount: number | null;
}): Promise<Evaluation> {
  const res = await fetch(`${BACKEND_URL}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "不明なエラー" }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data as Evaluation;
}
