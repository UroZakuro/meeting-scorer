/**
 * 課金処理の統合モジュール。
 *
 * iOS / Android: RevenueCat (react-native-purchases)
 * Web:           Stripe Checkout（バックエンド経由）
 *
 * ─── RevenueCat の本番化手順 ───────────────────────────────────
 * 1. https://app.revenuecat.com でプロジェクト作成
 * 2. App Store Connect / Google Play Console で IAP 商品を作成
 *    - 月額: `premium_monthly`
 *    - 年額: `premium_yearly`
 * 3. RevenueCat でエンタイトルメント `premium` を作成し上記商品を紐付け
 * 4. SDK キーを取得し、下記 REVENUECAT_API_KEY に設定
 * 5. `npm install react-native-purchases --legacy-peer-deps`
 * 6. EAS 開発ビルドを作成（expo-modules-core が必要なため Expo Go 不可）
 * 7. 下記コメントアウト部分を有効化して現在の実装を置き換える
 *
 * ─── Stripe の本番化手順 ──────────────────────────────────────
 * 1. https://dashboard.stripe.com でアカウント作成
 * 2. 商品とサブスクリプション価格を作成し、Price ID を取得
 *    - 月額: price_monthly_xxx
 *    - 年額: price_yearly_xxx
 * 3. STRIPE_SECRET_KEY を backend/.env に設定
 * 4. STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY を設定
 * 5. バックエンドの /api/stripe/* エンドポイントが有効になる
 */
import { Platform } from "react-native";
import { useEntitlementStore } from "../store/useEntitlementStore";

// ─── 定数（本番時に差し替え） ─────────────────────────────────
export const REVENUECAT_API_KEY = Platform.select({
  ios: "appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  android: "goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  default: "",
});
export const RC_ENTITLEMENT_ID = "premium";
export const RC_PRODUCT_MONTHLY = "premium_monthly";
export const RC_PRODUCT_YEARLY = "premium_yearly";
export const BACKEND_URL = "http://localhost:3001";

// ─── 初期化（アプリ起動時に呼ぶ） ────────────────────────────
export async function initPurchases(userId?: string) {
  if (Platform.OS === "web") return;

  // TODO: RevenueCat 本番化後に有効化
  // const Purchases = (await import("react-native-purchases")).default;
  // Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
  console.log("[Purchases] RevenueCat init（本番化後に有効）");
}

// ─── 購入（モバイル） ──────────────────────────────────────
export async function purchaseMobile(plan: "monthly" | "yearly"): Promise<boolean> {
  const productId = plan === "monthly" ? RC_PRODUCT_MONTHLY : RC_PRODUCT_YEARLY;

  // TODO: RevenueCat 本番化後に有効化
  // const Purchases = (await import("react-native-purchases")).default;
  // const { customerInfo } = await Purchases.purchaseProduct(productId);
  // return !!customerInfo.entitlements.active[RC_ENTITLEMENT_ID];

  console.log(`[Purchases] 購入: ${productId}（RevenueCat 本番化後に有効）`);
  // 開発用: ダミーで成功扱い
  useEntitlementStore.getState().setPremium(true);
  return true;
}

// ─── 復元（モバイル） ──────────────────────────────────────
export async function restorePurchasesMobile(): Promise<boolean> {
  // TODO: RevenueCat 本番化後に有効化
  // const Purchases = (await import("react-native-purchases")).default;
  // const info = await Purchases.restorePurchases();
  // const active = !!info.entitlements.active[RC_ENTITLEMENT_ID];
  // useEntitlementStore.getState().setPremium(active);
  // return active;

  console.log("[Purchases] 復元（RevenueCat 本番化後に有効）");
  return false;
}

// ─── Stripe Checkout セッション作成（Web） ───────────────────
export async function createStripeCheckout(plan: "monthly" | "yearly"): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new Error("Stripe セッション作成に失敗しました");
  const { url } = await res.json();
  return url as string;
}

// ─── Stripe 購入状態確認（Web） ──────────────────────────────
export async function checkStripeStatus(sessionId: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/api/stripe/status?session_id=${sessionId}`);
  if (!res.ok) return false;
  const { active } = await res.json();
  if (active) useEntitlementStore.getState().setPremium(true);
  return active as boolean;
}
