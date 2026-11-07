import { defaultFilter, equals, defaultChecker } from './util';

import { IOptions } from './types';

export * from './types';
export * from './util';

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
export function array_unique<T>(arr: T, options: IOptions<T> = {}): T
{
	/**
	 * 進流程前先防禦：非陣列輸入直接拋出 TypeError，
	 * 避免延後到 filter / splice 階段才出現難以定位的錯誤。
	 */
	if (!Array.isArray(arr))
	{
		throw new TypeError(`Expected an Array but got ${typeof arr}.`)
	}

	const cb = defaultFilter(options);

	/**
	 * 覆寫模式與預設模式共用同一個 cb：差別只在「就地移除」與「另建新陣列」，兩者去重結果一致。
	 */
	if (options.overwrite)
	{
		/**
		 * 從尾到頭逐項檢查：由後往前 splice 才不會讓後續索引位移，
		 * cb 回傳 false（重複項或未通過 filter）就地移除。
		 */
		let index = arr.length;

		while (index--)
		{
			let val = arr[index];

			if (!cb(val, index, arr))
			{
				arr.splice(index, 1);
			}
		}

		return arr;
	}

	// @ts-ignore
	return arr.filter(cb);
}

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
export function array_unique_overwrite<T>(arr: T, options: IOptions<T> = {}): T
{
	return array_unique(arr, {
		...options,
		overwrite: true,
	});
}

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
export function lazy_unique<T extends any[]>(arr: T): T
export function lazy_unique<T, T1, T2>(a1: T1, a2: T2, ...arr: T[]): Array<T | T1 | T2>
export function lazy_unique<T>(...arr: Array<T | T[]>): T | (T | T[])[]
// @ts-ignore
export function lazy_unique<T>(...arr: Array<T | T[]>)
{
	/**
	 * 多個參數時視為同一個陣列、對參數清單本身去重（回傳陣列）；
	 * 單一參數則代表呼叫者已經把陣列傳進來，直接對該陣列去重。
	 */
	if (arr.length > 1)
	{
		return array_unique(arr);
	}

	return array_unique(arr[0]);
}

/**
 * 懶惰唯一化覆寫模式
 * Lazy unique overwrite mode
 *
 * @param arr - 陣列或參數 / Array or arguments
 * @returns 去重後的結果 / Deduplicated result
 */
export function lazy_unique_overwrite<T>(...arr: Array<T | T[]>)
{
	if (arr.length > 1)
	{
		return array_unique_overwrite(arr);
	}

	return array_unique_overwrite(arr[0]);
}

/**
 * 導出工具函式 / Export utility functions
 */
export {
	equals,
	defaultFilter,
	defaultChecker,
}

/**
 * 非 ESM 格式（CJS / UMD）時，把完整 API 以不可列舉 (Non-enumerable) 屬性掛到預設導出上：
 * 讓 `require('array-hyper-unique')` 單一入口就能取用全部函式，
 * 同時不改變 lazy_unique 本身的可列舉外觀（for...in / Object.keys 看不到這些屬性）。
 */
if (process.env.TSDX_FORMAT !== 'esm')
{
	Object.defineProperty(lazy_unique, "array_unique", { value: array_unique });
	Object.defineProperty(lazy_unique, "array_unique_overwrite", { value: array_unique_overwrite });
	Object.defineProperty(lazy_unique, "lazy_unique_overwrite", { value: lazy_unique_overwrite });

	Object.defineProperty(lazy_unique, "equals", { value: equals });
	Object.defineProperty(lazy_unique, "defaultFilter", { value: defaultFilter });
	Object.defineProperty(lazy_unique, "defaultChecker", { value: defaultChecker });

	Object.defineProperty(lazy_unique, "lazy_unique", { value: lazy_unique });
	Object.defineProperty(lazy_unique, "default", { value: lazy_unique });

	Object.defineProperty(lazy_unique, "__esModule", { value: true });
}

export default lazy_unique
