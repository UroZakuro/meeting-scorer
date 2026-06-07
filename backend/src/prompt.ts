import type { SpeakerStat } from "./types.js";

export const SYSTEM_PROMPT = `あなたは会議の品質を厳しく評価する監査役です。甘い評価はしません。
良かった点を並べるより、無駄・偏り・結論の弱さを率直に指摘してください。
以下の文字起こしと定量データを読み、指定のJSON形式だけを返してください。前置きや説明文は出力しないでください。

評価軸と最大減点（100点からの減点方式）:
1. 会議の必要性 (最大-20)
2. 結論とアクション (最大-25)
3. 時間対効果 (最大-15)
4. 目的・アジェンダ (最大-10)
5. 発言の偏り (最大-10)
6. 発言の中身 (最大-10)
7. ノイズ（フィラー・脱線・繰り返し） (最大-10)

ルール:
- 迷ったら厳しめに採点する。
- 各軸の指摘には、文字起こし中の該当発言を1文程度で引用する。引用できない指摘は書かない。
- 一言講評は辛口にする。ただし人格攻撃はせず、会議の進め方そのものを評価する。
- 改善アクションは具体的な行動にする。抽象的な助言は禁止。

出力するJSONの形式:
{
  "overallScore": 整数(0-100),
  "oneLineVerdict": "辛口の一言講評（80字以内）",
  "wasMeetingNecessary": { "necessary": true/false, "reason": "理由（80字以内）" },
  "couldHaveBeenShortenedMinutes": 整数（短縮できたと推定する分数。0以上）,
  "axes": [
    {
      "id": 1,
      "name": "会議の必要性",
      "deduction": 整数（その軸での減点。0以上、最大減点以内）,
      "comment": "指摘（120字以内）",
      "evidenceQuote": "該当する発言の引用（1文程度。なければ空文字）"
    }
  ],
  "improvements": ["具体的な改善アクション", "..."]
}`;

export function buildUserMessage(params: {
  transcript: string;
  speakerStats: SpeakerStat[];
  durationMinutes: number | null;
  participantCount: number | null;
}): string {
  const { transcript, speakerStats, durationMinutes, participantCount } = params;

  const statsText = speakerStats
    .map(
      (s) =>
        `  ${s.speaker}: 発言${s.utteranceCount}回 / ${s.charCount}文字 / シェア${s.sharePercent}% / フィラー${s.fillerCount}回 / 推定${s.estimatedMinutes}分`
    )
    .join("\n");

  const totalFillers = speakerStats.reduce((sum, s) => sum + s.fillerCount, 0);
  const topShare = speakerStats[0]?.sharePercent ?? 0;

  return `【定量データ】
所要時間: ${durationMinutes != null ? `${durationMinutes}分` : "不明"}
参加人数: ${participantCount != null ? `${participantCount}名` : "不明"}
話者別統計:
${statsText}
フィラー合計: ${totalFillers}回
最大発言シェア: ${topShare}%

【文字起こし全文】
${transcript}`;
}
