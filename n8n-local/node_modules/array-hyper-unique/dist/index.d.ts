import { ITSLogicIsNever, ITSReadonlyPick, ITSTypeAndStringLiteral } from 'ts-type';

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
	checker?(elementA: ITSVslueOfArrayOrAny<T>, elementB: ITSVslueOfArrayOrAny<T>, indexA: IExtractIndexKeyOfArray03<T>, indexB: IExtractIndexKeyOfArray03<T>, _arr?: T, runtimeCache?: TDefaultFilterOptions<T>): boolean;
	checker?<R>(elementA: ITSVslueOfArrayOrAny<R>, elementB: ITSVslueOfArrayOrAny<R>, indexA: IExtractIndexKeyOfArray03<R>, indexB: IExtractIndexKeyOfArray03<R>, _arr?: R, runtimeCache?: TDefaultFilterOptions<T>): boolean;
	/**
	 * 是否覆寫原陣列
	 * Whether to overwrite original array
	 *
	 * 當設為 true 時，會直接修改原陣列而非建立新陣列。
	 * When set to true, will modify the original array instead of creating a new one.
	 */
	overwrite?: boolean;
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
	filter?(elementA: ITSVslueOfArrayOrAny<T>, indexA: IExtractIndexKeyOfArray03<T>, arr: T, runtimeCache?: TDefaultFilterOptions<T>): boolean;
	filter?<R>(elementA: ITSVslueOfArrayOrAny<R>, indexA: IExtractIndexKeyOfArray03<R>, arr: R, runtimeCache?: TDefaultFilterOptions<T>): boolean;
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
	removeFromFirst?: boolean;
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
	allowDuplicate?(elementA: ITSVslueOfArrayOrAny<T>, indexA: IExtractIndexKeyOfArray03<T>, arr: T, runtimeCache?: TDefaultFilterOptions<T>): boolean;
	allowDuplicate?<R>(elementA: ITSVslueOfArrayOrAny<R>, indexA: IExtractIndexKeyOfArray03<R>, arr: R, runtimeCache?: TDefaultFilterOptions<T>): boolean;
};
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
export type IExtractIndexKeyOfArray03<T> = ITSLogicIsNever<T> extends false ? T extends readonly unknown[] ? number extends T["length"] ? number : Extract<keyof T, `${number}`> extends infer K ? K extends `${infer N extends number}` ? N : never : never : never : number;
export type IExtractIndexKeyOfArray04<T> = ITSTypeAndStringLiteral<IExtractIndexKeyOfArray03<T>>;
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
export type TDefaultFilterOptions<T> = ITSReadonlyPick<IOptions<T>, "checker" | "filter" | "allowDuplicate"> & {
	readonly find: IFindFn<T>;
};
/**
 * 深度相等性比較函式
 * Deep equality comparison function
 *
 * 應用情境：
 * - 比較兩個物件是否深度相等
 * - 用於去重邏輯中的相等性判斷
 * - Compare if two objects are deeply equal
 * - Used for equality checking in deduplication logic
 *
 * @param a1 - 要比較的第一個值 / First value to compare
 * @param a2 - 要比較的第二個值 / Second value to compare
 * @returns 是否相等 / Whether equal
 *
 * @example
 * equals({a: 1}, {a: 1}); // => true
 * equals([1, 2], [1, 2]); // => true
 * equals({a: 1}, {a: 2}); // => false
 */
export declare function equals<T>(a1: T, a2: T): boolean;
export declare function equals<T>(a1: T, a2: unknown): a2 is T;
export declare function equals<T>(a1: unknown, a2: T): a1 is T;
/**
 * 建立預設過濾回調函式
 * Create default filter callback function
 *
 * 應用情境：
 * - 為 array_unique 函式建立預設的過濾邏輯
 * - 支援自訂 checker、filter 與 allowDuplicate 函式
 * - Create default filter logic for array_unique function
 * - Support custom checker, filter and allowDuplicate functions
 *
 * 三個 callback 的職責分工（結論）：
 * - `allowDuplicate` 決定「要不要檢查」——回傳 true 即略過唯一性判斷
 * - `checker` 決定「怎麼算相同」——唯一性判斷採用的相等性規則
 * - `filter` 決定「要不要保留」——不論前兩者回傳什麼，它都是最終保留條件
 *
 * @param options - 選項 / Options
 * @returns 過濾回調函式 / Filter callback function
 */
export declare function defaultFilter<T>(options?: IOptions<T>): <K extends any[]>(elementA: ITSVslueOfArrayOrAny<K>, indexA: IExtractIndexKeyOfArray03<K>, arr: K) => boolean;
/**
 * 預設相等性檢查函式
 * Default equality check function
 *
 * 使用 deep-eql 進行深度相等性比較。
 *
 * 無狀態 (Stateless)：簽名雖依 checker 的呼叫形式帶有 indexA / indexB / arr / runtimeCache，
 * 但比對只看 elementA 與 elementB，其餘參數一律忽略（以底線前綴標示）。
 *
 * @param elementA - 正在被檢查的元素 / Element currently being checked
 * @param elementB - find 掃描到的候選元素 / Candidate element scanned by find
 * @param _indexA - elementA 的索引（未使用）
 * @param _indexB - elementB 的索引（未使用）
 * @param _arr - 原始陣列（未使用）
 * @param _runtimeCache - 執行期快取 (Runtime Cache)（未使用）
 * @returns 是否相等 / Whether equal
 */
export declare function defaultChecker(elementA: any, elementB: any, _indexA: number, _indexB: number, _arr: any[], _runtimeCache: TDefaultFilterOptions<any>): boolean;
/**
 * 取得陣列的唯一值，支援深度比較
 * Get unique values from array with deep comparison support
 *
 * 應用情境：
 * - 去除複雜物件陣列中的重複項
 * - 處理巢狀物件和陣列的比對
 * - 支援自訂相等性判斷函式
 * - Remove duplicates from complex object arrays
 * - Handle nested objects and arrays comparison
 * - Support custom equality check function
 *
 * 決策順序與流程圖見 {@link array_unique_overwrite}。
 *
 * @param arr - 要去重的陣列 / Array to deduplicate
 * @param options - 去重選項 / Deduplication options
 * @returns 去重後的陣列 / Deduplicated array
 * @throws TypeError - 當輸入不是陣列時 / When input is not an array
 *
 * @example
 * // 基本使用
 * array_unique([1, 2, 2, 3]); // => [1, 2, 3]
 *
 * // 物件去重
 * array_unique([{a: 1}, {a: 1}, {a: 2}]); // => [{a: 1}, {a: 2}]
 *
 * // 巢狀陣列去重
 * array_unique([[1,2], [1,2], [1,3]]); // => [[1,2], [1,3]]
 *
 * // 以 callback 允許某些值保留重複項
 * array_unique(['*.log', '*.log', '', ''], { allowDuplicate: (v) => v === '' }); // => ['*.log', '', '']
 */
export declare function array_unique<T>(arr: T, options?: IOptions<T>): T;
/**
 * 覆寫模式去重，直接修改原陣列
 * Overwrite mode deduplication, modifies original array
 *
 * 各邏輯的決策順序與流程圖：
 *
 *   array_unique_overwrite(arr, options)
 *     └─> array_unique(arr, { ...options, overwrite: true })
 *
 *   array_unique(arr, options)
 *     ├─ !Array.isArray(arr) ──> throw TypeError
 *     ├─ defaultFilter(options)
 *     │    ├─ find = removeFromFirst ? findLastIndex : findIndex
 *     │    └─ runtimeCache = { checker, filter, allowDuplicate, find }
 *     ├─ overwrite = true  ──> 從尾到頭逐項呼叫 cb，回傳 false 則 splice 就地移除
 *     └─ overwrite = false ──> arr.filter(cb)，回傳 false 則不加入新陣列
 *
 *   cb(elementA, indexA, arr)（兩種模式共用同一套決策）
 *     ① allowDuplicate(elementA, indexA, arr, runtimeCache) ?
 *     │    ├─ false ──> ②
 *     │    └─ true  ──> ③（略過 ② 與 checker 比對）
 *     ② i = find(arr, (elementB, indexB) => checker(elementA, elementB, indexA, indexB, arr, runtimeCache))
 *     │    └─ 判斷 i === indexA（elementA 是否為基準位置）
 *     │         ├─ false ──> ✗ 移除（重複項）
 *     │         └─ true  ──> ③
 *     ③ filter(elementA, indexA, arr, runtimeCache) ?
 *          ├─ true  ──> ✓ 保留
 *          └─ false ──> ✗ 移除
 *
 * @param arr - 要去重的陣列 / Array to deduplicate
 * @param options - 去重選項 / Deduplication options
 * @returns 去重後的陣列（與輸入相同）/ Deduplicated array (same as input)
 */
export declare function array_unique_overwrite<T>(arr: T, options?: IOptions<T>): T;
/**
 * 懶惰唯一化函式，支援多種呼叫方式
 * Lazy unique function with multiple calling patterns
 *
 * 應用情境：
 * - 單一陣列輸入
 * - 多個參數或陣列混合輸入
 * - 靈活的 API 設計
 * - Single array input
 * - Multiple arguments or array mixing
 * - Flexible API design
 *
 * @param arr - 陣列或單一元素 / Array or single element
 * @returns 去重後的結果 / Deduplicated result
 *
 * @example
 * // 單一陣列
 * lazy_unique([1, 2, 2, 3]); // => [1, 2, 3]
 *
 * // 多個參數
 * lazy_unique(1, 2, 2, 3); // => [1, 2, 3]
 *
 * // 混合
 * lazy_unique([1, 2], [2, 3]); // => [1, 2, 3]
 */
export declare function lazy_unique<T extends any[]>(arr: T): T;
export declare function lazy_unique<T, T1, T2>(a1: T1, a2: T2, ...arr: T[]): Array<T | T1 | T2>;
export declare function lazy_unique<T>(...arr: Array<T | T[]>): T | (T | T[])[];
/**
 * 懶惰唯一化覆寫模式
 * Lazy unique overwrite mode
 *
 * @param arr - 陣列或參數 / Array or arguments
 * @returns 去重後的結果 / Deduplicated result
 */
export declare function lazy_unique_overwrite<T>(...arr: Array<T | T[]>): T | (T | T[])[];

export {
	lazy_unique as default,
};

export {};
