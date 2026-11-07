import { ref, unref } from "vue";
import { onKeyDown, onKeyUp } from "@vueuse/core";

//#region src/useShortKeyPress.ts
function useShortKeyPress(key, fn, { dedupe = true, threshold = 300, disabled = false }) {
	const keyDownTime = ref(null);
	onKeyDown(key, () => {
		if (unref(disabled)) return;
		keyDownTime.value = Date.now();
	}, { dedupe });
	onKeyUp(key, () => {
		if (unref(disabled) || !keyDownTime.value) return;
		if (Date.now() - keyDownTime.value < threshold) fn();
	});
}

//#endregion
export { useShortKeyPress };
//# sourceMappingURL=useShortKeyPress.mjs.map