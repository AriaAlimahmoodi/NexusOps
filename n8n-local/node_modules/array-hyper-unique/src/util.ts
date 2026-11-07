/// <reference types="lodash" />
// @ts-ignore
import _equals from 'deep-eql';
import { IExtractIndexKeyOfArray03, IOptions, ITSVslueOfArrayOrAny, TDefaultFilterOptions } from './types';
// @ts-ignore
import { findLastIndex, findIndex } from 'lodash';

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
export function equals<T>(a1: T, a2: T): boolean
export function equals<T>(a1: T, a2: unknown): a2 is T
export function equals<T>(a1: unknown, a2: T): a1 is T
export function equals(a1: any, a2: any): boolean
{
	return _equals(a1, a2)
}

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
export function defaultFilter<T>(options: IOptions<T> = {})
{
	const checker: IOptions<T>['checker'] = options.checker || defaultChecker as any;
	const filter: IOptions<T>['filter'] = options.filter || null;
	const allowDuplicate: IOptions<T>['allowDuplicate'] = options.allowDuplicate || null;

	/**
	 * 依 removeFromFirst 決定唯一性判斷的掃描方向：
	 * 預設 findIndex（以第一次出現為基準），true 則 findLastIndex（以最後一次出現為基準）
	 */
	const find = options.removeFromFirst ? findLastIndex : findIndex;

	/**
	 * 執行期快取 (Runtime Cache)：在建立 callback 之前先固化本次去重實際採用的選項與 find 實作，
	 * 並以同一份物件傳入每個 callback，使 callback 能取得執行期的設定。
	 *
	 * 更改內容不會影響已建立的 callback，確保執行期的一致性。
	 */
	const runtimeCache: TDefaultFilterOptions<T> = {
		checker,
		filter,
		allowDuplicate,
		// @ts-ignore
		find,
	};

	const cb = <K extends any[]>(elementA: ITSVslueOfArrayOrAny<K>, indexA: IExtractIndexKeyOfArray03<K>, arr: K) =>
	{
		/**
		 * allowDuplicate 決定「要不要檢查」：允許重複的值略過 `i === indexA` 唯一性判斷與 checker 比對，
		 * 但仍然交給 filter（最終保留條件）決定去留。
		 */
		if (allowDuplicate && allowDuplicate(elementA, indexA, arr, runtimeCache))
		{
			return !filter || filter(elementA, indexA, arr, runtimeCache);
		}

		/**
		 * checker 決定「怎麼算相同」：find 取得第一個／最後一個相等值的位置 i，
		 * `i === indexA` 代表目前元素本身就是基準位置（尚未出現過的重複項），
		 * 通過後仍須滿足 filter（最終保留條件）。
		 */
		let i = find(arr, (elementB, indexB) => checker(elementA, elementB, indexA, indexB, arr, runtimeCache));
		return i === indexA && (!filter || filter(elementA, indexA, arr, runtimeCache));
	};

	return cb;
}

// @ts-ignore
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
export function defaultChecker(elementA: any, elementB: any, _indexA: number, _indexB: number, _arr: any[], _runtimeCache: TDefaultFilterOptions<any>): boolean
{
	return _equals(elementA, elementB);
}
