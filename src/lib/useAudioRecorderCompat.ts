/**
 * expo-audio の useAudioRecorder はネイティブのみ対応。
 * Web では同じインターフェースのダミーを返す。
 */
import { Platform } from "react-native";

type RecorderCompat = {
  uri: string | null;
  prepareToRecordAsync: () => Promise<void>;
  record: () => void;
  stop: () => void;
};

// Web 用ダミー
function useDummyRecorder(): RecorderCompat {
  return {
    uri: null,
    prepareToRecordAsync: async () => {},
    record: () => {},
    stop: () => {},
  };
}

// ネイティブ用: expo-audio の実装をラップ
function useNativeRecorder(): RecorderCompat {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAudioRecorder, RecordingPresets } = require("expo-audio");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  return recorder as RecorderCompat;
}

export function useAudioRecorderCompat(): RecorderCompat {
  // Platform.OS は静的に決まるのでフック違反にならない
  if (Platform.OS === "web") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDummyRecorder();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useNativeRecorder();
}
