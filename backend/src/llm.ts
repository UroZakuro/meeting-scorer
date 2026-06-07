import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt.js";
import type { EvaluateRequest } from "./types.js";

const provider = process.env.LLM_PROVIDER ?? "anthropic";

// ── モックモード ──────────────────────────────────────────────
// ANTHROPIC_API_KEY / OPENAI_API_KEY が未設定のときに使うダミー採点。
// UIの開発・確認用。実際の文字起こし内容は反映しない。
function mockEvaluate(req: EvaluateRequest): unknown {
  const topSpeaker = req.speakerStats[0]?.speaker ?? "参加者A";
  const topShare = req.speakerStats[0]?.sharePercent ?? 60;
  const totalFillers = req.speakerStats.reduce((s, x) => s + x.fillerCount, 0);

  return {
    overallScore: 42,
    oneLineVerdict:
      "結論もアクションも出ないまま終わった典型的な時間の無駄。報告はメールで十分だった。",
    wasMeetingNecessary: {
      necessary: false,
      reason: "共有・報告のみで議論がなく、チャットで代替できる内容だった。",
    },
    couldHaveBeenShortenedMinutes: req.durationMinutes ? Math.round(req.durationMinutes * 0.6) : 10,
    axes: [
      {
        id: 1, name: "会議の必要性", deduction: 15,
        comment: "報告と確認だけで、わざわざ集まる必要のない内容だった。",
        evidenceQuote: "「先月の数字が出ました。前月比でまあ横ばいです。」",
      },
      {
        id: 2, name: "結論とアクション", deduction: 22,
        comment: "「次回ということで」で締めており、担当者・期限つきのアクションが一切出ていない。",
        evidenceQuote: "「では次回ということで。」",
      },
      {
        id: 3, name: "時間対効果", deduction: 12,
        comment: "所要時間に対して決まった事項がゼロに等しく、時間対効果は最悪。",
        evidenceQuote: "「じゃあ以上で終わりにしましょう。」",
      },
      {
        id: 4, name: "目的・アジェンダ", deduction: 8,
        comment: "冒頭でアジェンダが示されず、話が都度流れていた。",
        evidenceQuote: "「ところで、別件なんですが」",
      },
      {
        id: 5, name: "発言の偏り", deduction: topShare >= 50 ? 8 : 3,
        comment: `${topSpeaker}が発言の${topShare}%を占めており、他の参加者の意見が引き出せていない。`,
        evidenceQuote: "",
      },
      {
        id: 6, name: "発言の中身", deduction: 6,
        comment: "「まあ横ばいです」「特に問題ないですかね」など、中身のない発言が多い。",
        evidenceQuote: "「なんか、特に問題ないですかね。」",
      },
      {
        id: 7, name: "ノイズ（フィラー・脱線・繰り返し）", deduction: Math.min(totalFillers, 10),
        comment: `フィラーが計${totalFillers}回検出された。「えーと」「まあ」「なんか」が繰り返され発言の密度を下げている。`,
        evidenceQuote: "「えーと、あと報告事項なんですが」",
      },
    ],
    improvements: [
      "アジェンダを事前にチャットで共有し、報告事項は会議前に読んでおく運用に切り替える",
      "会議の冒頭30秒でゴール（この会議で何を決めるか）を一言宣言する",
      "各アクションには必ず「担当者名＋期日」をセットにして議事録に残す",
      "報告・共有のみの議題はSlack/メールに移し、会議は意思決定と議論だけに絞る",
      "「持ち帰ります」「次回に」は禁止ワードとして設定し、その場で決める文化を作る",
    ],
  };
}

/** コードフェンスを除去してJSONをパース */
function parseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function evaluateWithLLM(req: EvaluateRequest): Promise<unknown> {
  // APIキーが未設定の場合はモックを返す
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-api");
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY?.startsWith("sk-");
  if (!hasAnthropicKey && !hasOpenAIKey) {
    console.log("[evaluate] APIキー未設定のためモックモードで動作します");
    await new Promise((r) => setTimeout(r, 1200)); // ローディング確認用の遅延
    return mockEvaluate(req);
  }

  const userMessage = buildUserMessage(req);

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return parseJson(text);
  }

  // OpenAI fallback
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });
  const text = res.choices[0]?.message.content ?? "{}";
  return parseJson(text);
}
