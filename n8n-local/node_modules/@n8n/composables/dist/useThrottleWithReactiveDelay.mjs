import { shallowRef, watch } from "vue";
import { useThrottleFn } from "@vueuse/core";

//#region src/useThrottleWithReactiveDelay.ts
/**
* Similar to `useThrottle` from @vueuse/core, but with changeable delay
*/
function useThrottleWithReactiveDelay(state, delay) {
	const throttled = shallowRef(state.value);
	watch(state, useThrottleFn((latest) => {
		throttled.value = latest;
	}, delay, true, true), { immediate: true });
	return throttled;
}

//#endregion
export { useThrottleWithReactiveDelay };
//# sourceMappingURL=useThrottleWithReactiveDelay.mjs.map