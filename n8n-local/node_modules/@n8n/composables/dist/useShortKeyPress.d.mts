import { MaybeRefOrGetter } from "vue";
import { KeyFilter } from "@vueuse/core";

//#region src/useShortKeyPress.d.ts
declare function useShortKeyPress(key: KeyFilter, fn: () => void, {
  dedupe,
  threshold,
  disabled
}: {
  dedupe?: boolean;
  threshold?: number;
  disabled?: MaybeRefOrGetter<boolean>;
}): void;
//#endregion
export { useShortKeyPress };
//# sourceMappingURL=useShortKeyPress.d.mts.map