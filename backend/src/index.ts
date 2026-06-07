import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { evaluateWithLLM } from "./llm.js";
import { transcribeAudio } from "./stt.js";
import { createCheckoutSession, getSubscriptionStatus } from "./stripe.js";
import type { EvaluateRequest } from "./types.js";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: ["http://localhost:8081", "http://localhost:19006", "http://localhost:3000"],
    allowMethods: ["POST", "GET", "OPTIONS"],
  })
);

app.get("/health", (c) => c.json({ ok: true }));

app.post("/api/transcribe", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("audio") as File | null;
    if (!file) return c.json({ error: "audioファイルが必要です" }, 400);

    const buffer = await file.arrayBuffer();
    const text = await transcribeAudio(buffer, file.name);
    console.log(`[transcribe] ${file.name} → ${text.length}文字`);

    return c.json({ transcript: text });
  } catch (err) {
    console.error("[transcribe] error:", err);
    return c.json({ error: "文字起こしに失敗しました" }, 500);
  }
});

app.post("/api/evaluate", async (c) => {
  try {
    const body = await c.req.json<EvaluateRequest>();

    if (!body.transcript || typeof body.transcript !== "string") {
      return c.json({ error: "transcript が必要です" }, 400);
    }

    const result = await evaluateWithLLM(body);
    // サーバーサイドのログには発言本文を残さない（プライバシー配慮）
    console.log(`[evaluate] score=${(result as { overallScore?: number }).overallScore ?? "?"}`);

    return c.json(result);
  } catch (err) {
    console.error("[evaluate] error:", err);
    return c.json({ error: "評価に失敗しました。しばらく待ってから再試行してください。" }, 500);
  }
});

// ─── Stripe エンドポイント ────────────────────────────────────
app.post("/api/stripe/checkout", async (c) => {
  try {
    const { plan } = await c.req.json<{ plan: "monthly" | "yearly" }>();
    const url = await createCheckoutSession(plan);
    return c.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "不明なエラー";
    return c.json({ error: msg }, 500);
  }
});

app.get("/api/stripe/status", async (c) => {
  try {
    const sessionId = c.req.query("session_id");
    if (!sessionId) return c.json({ active: false });
    const active = await getSubscriptionStatus(sessionId);
    return c.json({ active });
  } catch (err) {
    console.error("[stripe/status] error:", err);
    return c.json({ active: false });
  }
});

const port = parseInt(process.env.PORT ?? "3001", 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Backend ready on http://localhost:${port}`);
});
