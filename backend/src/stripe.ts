/**
 * Stripe Checkout セッション管理。
 *
 * ─── 本番化手順 ───────────────────────────────────────────────
 * 1. https://dashboard.stripe.com でアカウント作成
 * 2. 商品を作成し Price ID を取得
 * 3. backend/.env に以下を追加:
 *    STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
 *    STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxxxxx
 *    STRIPE_PRICE_YEARLY=price_xxxxxxxxxxxxxxxx
 *    STRIPE_SUCCESS_URL=https://your-app.com/payment-success
 *    STRIPE_CANCEL_URL=https://your-app.com/paywall
 * 4. Stripe ダッシュボードで Webhook を設定し STRIPE_WEBHOOK_SECRET を追加
 */
import Stripe from "stripe";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY が設定されていません");
  }
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

export async function createCheckoutSession(plan: "monthly" | "yearly"): Promise<string> {
  const stripe = getStripe();
  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY;

  if (!priceId) throw new Error("Stripe の Price ID が設定されていません");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.STRIPE_SUCCESS_URL ?? "http://localhost:8081/payment-success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: process.env.STRIPE_CANCEL_URL ?? "http://localhost:8081/paywall",
  });

  return session.url ?? "";
}

export async function getSubscriptionStatus(sessionId: string): Promise<boolean> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  const sub = session.subscription as Stripe.Subscription | null;
  return sub?.status === "active" || sub?.status === "trialing";
}
