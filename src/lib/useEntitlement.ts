/**
 * 課金状態を一元管理するフック。
 * 広告表示・機能制限はすべてここの isPremium だけを見る。
 */
import { useEntitlementStore } from "../store/useEntitlementStore";
import { useMeetingStore } from "../store/useMeetingStore";

export function useEntitlement() {
  const isPremium = useEntitlementStore((s) => s.isPremium);
  const monthlyEvaluationCount = useEntitlementStore((s) => s.monthlyEvaluationCount);
  const canEvaluate = useEntitlementStore((s) => s.canEvaluate);
  const canSaveHistory = useEntitlementStore((s) => s.canSaveHistory);
  const incrementEvaluationCount = useEntitlementStore((s) => s.incrementEvaluationCount);
  const historyLength = useMeetingStore((s) => s.history.length);

  return {
    isPremium,
    monthlyEvaluationCount,
    canEvaluate: canEvaluate(),
    canSaveNewHistory: canSaveHistory(historyLength),
    incrementEvaluationCount,
  };
}
