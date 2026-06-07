/**
 * 音声ファイル → 文字起こし
 * OpenAI Whisper API を使う。
 * APIキー未設定の場合はモックテキストを返す。
 */
import OpenAI from "openai";
import { Readable } from "stream";

function isMockMode() {
  return !process.env.OPENAI_API_KEY?.startsWith("sk-");
}

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  filename: string
): Promise<string> {
  if (isMockMode()) {
    console.log("[stt] APIキー未設定のためモックテキストを返します");
    await new Promise((r) => setTimeout(r, 1500));
    return `田中: えーと、本日はお集まりいただきありがとうございます。まあ、先週の件について報告したいと思います。
佐藤: はい、よろしくお願いします。
田中: あの、数字的にはまあ横ばいでして、特に問題はないかなと思っています。
鈴木: そうですか。なんか、具体的なアクションは何かありますか？
田中: えーと、現状維持で様子を見るということで、とりあえずよいかなと。
佐藤: わかりました。では次回また確認しましょう。
田中: はい、以上です。`;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // ArrayBuffer → File-like オブジェクト
  const blob = new Blob([audioBuffer]);
  const file = new File([blob], filename, { type: "audio/mpeg" });

  const response = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ja",
    response_format: "text",
  });

  return response as unknown as string;
}
