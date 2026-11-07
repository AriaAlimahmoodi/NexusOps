/**
 * Created by user on 2020/6/6.
 */
import type { ITSRequiredPick, ITSRequireAtLeastOne, ITSReadonlyPick, ITSTypeAndStringLiteral, ITSLogicIsNever } from 'ts-type';

/**
 * 陣列去重選項介面
 * Array deduplication options interface
 *
 * T 為陣列型別。
 *
 * 三個 callback 的職責分工（結論）：
 * - `allowDuplicate` 決定「要不要檢查」——回傳 true 即略過唯一性判斷
 * - `checker` 決定「怎麼算相同」——唯一性判斷採用的相等性規則
 * - `filter` 決定「要不要保留」——不論前兩者回傳什麼，它都是最終保留條件
 *
 * @template T - 陣列型別 / Array type
 */
export type IOptions<T> = {

	/**
	 * 自訂相等性檢查函式
	 * Custom equality check function
	 *
	 * 「怎麼算相同」：只在唯一性判斷時被呼叫，`allowDuplicate` 已放行的元素不會經過此檢查。
	 *
	 * 呼叫形式固定為 `find(arr, (elementB, indexB) => checker(elementA, elementB, indexA, indexB, arr, runtimeCache))`：
	 * - `elementA` / `indexA` 是正在被檢查的元素（外層 `cb` 的參數），同一次判斷中固定不變
	 * - `elementB` / `indexB` 是 find 逐一掃描到的候選位置，每次呼叫都會推進
	 *
	 * 因此呼叫次數與順序取決於 find 的掃描方向：
	 * `removeFromFirst: false` 走 `findIndex`（由頭往尾）、`true` 走 `findLastIndex`（由尾往頭），遇到第一個回傳 true 就停止。
	 *
	 * @param elementA - 正在被檢查的元素 / Element currently being checked
	 * @param elementB - find 掃描到的候選元素 / Candidate element scanned by find
	 * @param indexA - elementA 的索引 / Index of elementA
	 * @param indexB - elementB 的索引 / Index of elementB
	 * @param _arr - 原始陣列 / Original array
	 * @param runtimeCache - 執行期快取 (Runtime Cache)，內含本次去重已解析的選項與 find
	 * @returns 是否視為相等 / Whether considered equal
	 */
	checker?(elementA: ITSVslueOfArrayOrAny<T>, elementB: ITSVslueOfArrayOrAny<T>, indexA: IExtractIndexKeyOfArray03<T>, indexB: IExtractIndexKeyOfArray03<T>, _arr?: T, runtimeCache?: TDefaultFilterOptions<T>): boolean,
	checker?<R>(elementA: ITSVslueOfArrayOrAny<R>, elementB: ITSVslueOfArrayOrAny<R>, indexA: IExtractIndexKeyOfArray03<R>, indexB: IExtractIndexKeyOfArray03<R>, _arr?: R, runtimeCache?: TDefaultFilterOptions<T>): boolean,

	/**
	 * 是否覆寫原陣列
	 * Whether to overwrite original array
	 *
	 * 當設為 true 時，會直接修改原陣列而非建立新陣列。
	 * When set to true, will modify the original array instead of creating a new one.
	 */
	overwrite?: boolean,

	/**
	 * 額外的過濾條件（最終保留條件）
	 * Additional filter condition (final keep condition)
	 *
	 * 「要不要保留」：不論 `allowDuplicate`、`checker` 的結果為何，回傳 false 一律移除該元素。
	 *
	 * @param elementA - 陣列元素
	 * @param indexA - 目前元素的索引
	 * @param arr - 原始陣列
	 * @param runtimeCache - 執行期快取 (Runtime Cache)
	 * @returns 是否保留該元素 / Whether to keep the element
	 */
	filter?(elementA: ITSVslueOfArrayOrAny<T>, indexA: IExtractIndexKeyOfArray03<T>, arr: T, runtimeCache?: TDefaultFilterOptions<T>): boolean,
	filter?<R>(elementA: ITSVslueOfArrayOrAny<R>, indexA: IExtractIndexKeyOfArray03<R>, arr: R, runtimeCache?: TDefaultFilterOptions<T>): boolean,

	/**
	 * 是否移除「較早」出現的重複項（保留最後一次）
	 * Whether to remove the *earlier* duplicates (keep the last occurrence)
	 *
	 * 本選項只決定唯一性判斷 `i === indexA` 以哪一個位置為基準，名稱容易被誤解為「從第一個元素開始刪除」：
	 * - `false`（預設）：以第一次出現為基準（`findIndex`），保留最先出現者，移除其後的重複項
	 * - `true`：以最後一次出現為基準（`findLastIndex`），保留最後出現者，移除較早的重複項
	 *
	 * 不影響 `allowDuplicate`（決定要不要檢查）與 `filter`（最終保留條件）。
	 */
	removeFromFirst?: boolean,

	/**
	 * 允許某些值保留重複項（以 callback 條件判斷）
	 * Allow certain values to keep duplicates (condition decided by a callback)
	 *
	 * 「要不要檢查」：原本的唯一性判斷為 `i === indexA`（`i` 為第一個／最後一個相同值的位置），
	 * 回傳 true 時會略過該判斷與 `checker` 比對，直接交給 `filter` 決定是否保留。
	 * 在三個 callback 中最先被呼叫。
	 *
	 * @param elementA - 陣列元素
	 * @param indexA - 目前元素的索引
	 * @param arr - 原始陣列
	 * @param runtimeCache - 執行期快取 (Runtime Cache)，內含本次去重已解析的選項與 find
	 * @returns 是否允許該值重複 / Whether to allow duplicates for the value
	 *
	 * @example
	 * // 允許空字串重複
	 * array_unique(lines, { allowDuplicate: (v) => v === '' });
	 */
	allowDuplicate?(elementA: ITSVslueOfArrayOrAny<T>, indexA: IExtractIndexKeyOfArray03<T>, arr: T, runtimeCache?: TDefaultFilterOptions<T>): boolean,
	allowDuplicate?<R>(elementA: ITSVslueOfArrayOrAny<R>, indexA: IExtractIndexKeyOfArray03<R>, arr: R, runtimeCache?: TDefaultFilterOptions<T>): boolean,
};

type IExtractIndexKeyOfArray01<T> =
	ITSLogicIsNever<T> extends false
		? T extends readonly unknown[]
			? number extends T['length']
				? number
				: {
					[K in keyof T]:
						K extends `${infer N extends number}`
							? (N | `${N}`)
							: never
				}[keyof T]
			: never
		: number;

type IExtractIndexKeyOfArray02<T> =
	ITSLogicIsNever<T> extends false
		? T extends readonly unknown[]
			? number extends T['length']
				? number
				: {
					[K in keyof T]:
						K extends `${infer N extends number}`
							? N
							: never
				}[keyof T]
			: never
		: number;

/**
 * @example
 * readonly ['a', 'b']               0 | 1
 * readonly ['a', 'b', ...string[]]  number
 * readonly string[]                 number
 * readonly []                       never
 *
 * @example
 * let a: IExtractIndexKeyOfArray03<readonly ['a', 'b']> = 0; // OK
 * let b: IExtractIndexKeyOfArray03<readonly ['a', 'b']> = 1; // OK
 * let c: IExtractIndexKeyOfArray03<readonly ['a', 'b']> = 2; // Error
 * let d: IExtractIndexKeyOfArray03<readonly ['a', 'b']> = 3; // Error
 */
export type IExtractIndexKeyOfArray03<T> =
	ITSLogicIsNever<T> extends false
		? T extends readonly unknown[]
			? number extends T['length']
				? number
				: Extract<keyof T, `${number}`> extends infer K
					? K extends `${infer N extends number}`
						? N
						: never
					: never
			: never
		: number;

export type IExtractIndexKeyOfArray04<T> = ITSTypeAndStringLiteral<IExtractIndexKeyOfArray03<T>>

/**
 * @example
 * ITSVslueOfArrayOrAny<['test', 'b']> = 'test' | 'b'
 * ITSVslueOfArrayOrAny<readonly string[]> = string
 * ITSVslueOfArrayOrAny<string, number> = 'string' // error
 */
export type ITSVslueOfArrayOrAny<T, R = any> = T extends readonly unknown[] ? T[Extract<keyof T, number>] : R;

/**
 * 集合迭代器 (List Iterator)
*
 * 供 findIndex / findLastIndex 的 predicate 使用。
 */
export type IListIterator<T, TResult> = (value: T, index: number, collection: readonly T[]) => TResult;

/**
 * 查找函式 (Find Function)
 *
 * 對應 findIndex / findLastIndex 的呼叫形式：`removeFromFirst` 決定 defaultFilter 採用哪一個實作。
 */
export type IFindFn<T> = (array: readonly T[] | null | undefined, predicate?: IListIterator<T, boolean>, fromIndex?: number) => number;

/**
 * 執行期快取 (Runtime Cache)
 *
 * 由 defaultFilter 在建立 callback 前解析一次，用來：
 * 1. 固化本次去重採用的 checker / filter / allowDuplicate 與 find 實作
 * 2. 以同一份物件傳入每個 callback，讓 callback 能取得執行期的實際設定
 *
 * 更改內容不會影響已建立的 callback，確保執行期的一致性。
 */
export type TDefaultFilterOptions<T> = ITSReadonlyPick<IOptions<T>, 'checker' | 'filter' | 'allowDuplicate'> & {
	readonly find: IFindFn<T>;
};

