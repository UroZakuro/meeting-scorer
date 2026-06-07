import { Utterance, SpeakerStat } from "../types";
import { CHARS_PER_MINUTE, FILLER_WORDS } from "./constants";

/**
 * 「話者名: 発言内容」形式のテキストをパースして Utterance[] に変換する。
 * 話者が読み取れない場合は speaker = null。
 */
export function parseTranscript(raw: string): Utterance[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: Utterance[] = [];

  for (const line of lines) {
    // "田中: テキスト" または "田中：テキスト" 形式
    const match = line.match(/^([^\s:：]{1,20})[：:]\s*(.+)$/);
    if (match) {
      result.push({ speaker: match[1], text: match[2] });
    } else {
      // 話者不明のベタ書き
      result.push({ speaker: null, text: line });
    }
  }
  return result;
}

/** 文字列中のフィラー出現数をカウントする */
function countFillers(text: string): number {
  let count = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(filler, "g");
    const matches = text.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/** Utterance[] から話者別統計を計算する */
export function calcSpeakerStats(utterances: Utterance[]): SpeakerStat[] {
  const map = new Map<
    string,
    { utteranceCount: number; charCount: number; fillerCount: number }
  >();

  for (const u of utterances) {
    const key = u.speaker ?? "（不明）";
    const prev = map.get(key) ?? { utteranceCount: 0, charCount: 0, fillerCount: 0 };
    map.set(key, {
      utteranceCount: prev.utteranceCount + 1,
      charCount: prev.charCount + u.text.length,
      fillerCount: prev.fillerCount + countFillers(u.text),
    });
  }

  const totalChars = Array.from(map.values()).reduce((s, v) => s + v.charCount, 0);

  const stats: SpeakerStat[] = [];
  for (const [speaker, v] of map.entries()) {
    stats.push({
      speaker,
      utteranceCount: v.utteranceCount,
      charCount: v.charCount,
      sharePercent: totalChars > 0 ? Math.round((v.charCount / totalChars) * 1000) / 10 : 0,
      fillerCount: v.fillerCount,
      estimatedMinutes: Math.round((v.charCount / CHARS_PER_MINUTE) * 10) / 10,
    });
  }

  return stats.sort((a, b) => b.charCount - a.charCount);
}
