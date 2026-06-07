/**
 * バナー広告コンポーネント。
 *
 * - isPremium = true  → 完全に非描画（null）
 * - Platform.OS = web → Google AdSense 枠（現在は審査前プレースホルダ）
 * - Platform.OS = ios/android → AdMob バナー（EAS 開発ビルド必要。現在はプレースホルダ）
 *
 * AdMob を本番で使う手順（Step 8 完全実装時）:
 *   1. EAS development build を作成（`eas build --profile development`）
 *   2. `react-native-google-mobile-ads` をインストール
 *   3. app.json の plugins に追加し、テスト用 App ID を設定
 *   4. 下記 ADMOB_BANNER_ID をテスト ID から本番 ID へ差し替え
 */
import { View, Text, StyleSheet, Platform } from "react-native";
import { useEntitlement } from "../lib/useEntitlement";

// AdMob テスト用 ID（本番公開時に差し替える）
// iOS:     ca-app-pub-3940256099942544/2934735716
// Android: ca-app-pub-3940256099942544/6300978111
export const ADMOB_BANNER_ID = Platform.select({
  ios: "ca-app-pub-3940256099942544/2934735716",
  android: "ca-app-pub-3940256099942544/6300978111",
  default: "",
});

type Props = {
  style?: object;
};

export function AdBanner({ style }: Props) {
  const { isPremium } = useEntitlement();

  // 有料ユーザーには広告を一切表示しない
  if (isPremium) return null;

  // Web: AdSense プレースホルダ（審査通過後に実際の ad code に差し替え）
  if (Platform.OS === "web") {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>広告</Text>
        {/* 本番: Google AdSense の <ins> タグをここに埋め込む */}
      </View>
    );
  }

  // iOS / Android: EAS 開発ビルドが必要なためプレースホルダ
  // EAS ビルド後は以下のように差し替える:
  // import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
  // return <BannerAd unitId={ADMOB_BANNER_ID} size={BannerAdSize.BANNER} />;
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.placeholderText}>広告（AdMob: EAS ビルド後に有効）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 50,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  placeholderText: { fontSize: 11, color: "#bbb" },
});
