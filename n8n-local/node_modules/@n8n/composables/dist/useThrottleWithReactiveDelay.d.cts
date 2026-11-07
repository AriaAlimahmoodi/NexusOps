import { Ref, ShallowRef } from "vue";

//#region src/useThrottleWithReactiveDelay.d.ts
declare function useThrottleWithReactiveDelay<T>(state: Ref<T>, delay: Ref<number>): ShallowRef<T>;
//#endregion
export { useThrottleWithReactiveDelay };
//# sourceMappingURL=useThrottleWithReactiveDelay.d.cts.map