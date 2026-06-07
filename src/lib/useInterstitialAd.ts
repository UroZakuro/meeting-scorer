/**
 * インタースティシャル広告フック（頻度制御つき）。
 *
 * - isPremium = true → 何もしない
 * - 2回に1回 かつ 前回表示から60秒以上経過した場合のみ表示する
 * - EAS 開発ビルド後に react-native-google-mobile-ads に差し替える
 */
import { useRef } from "react";
import { useEntitlement } from "./useEntitlement";

// AdMob テスト用インタースティシャル ID
// iOS:     ca-app-pub-3940256099942544/4411468910
// Android: ca-app-pub-3940256099942544/1033173712
const INTERSTITIAL_COOLDOWN_MS = 60_000; // 60秒
const INTERSTITIAL_FREQUENCY = 2; // 2回に1回

export function useInterstitialAd() {
  const { isPremium } = useEntitlement();
  const showCountRef = useRef(0);
  const lastShownAtRef = useRef<number>(0);

  function maybeShow() {
    if (isPremium) return;

    showCountRef.current += 1;
    const now = Date.now();
    const enoughTimePassed = now - lastShownAtRef.current > INTERSTITIAL_COOLDOWN_MS;
    const isFrequencyMatch = showCountRef.current % INTERSTITIAL_FREQUENCY === 0;

    if (!isFrequencyMatch || !enoughTimePassed) return;

    lastShownAtRef.current = now;

    // EAS 開発ビルド後の実装例:
    // const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, { requestNonPersonalizedAdsOnly: true });
    // interstitial.addAdEventListener(AdEventType.LOADED, () => interstitial.show());
    // interstitial.load();
    console.log("[AdMob] インタースティシャル表示（EAS ビルド後に有効）");
  }

  return { maybeShow };
}
