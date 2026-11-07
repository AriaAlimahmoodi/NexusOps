'use strict';

var _equals = require('deep-eql');
var lodash = require('lodash');

/// <reference types="lodash" />
// @ts-ignore
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

function equals(a1, a2) {
  return _equals(a1, a2);
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
function defaultFilter(options = {}) {
  const checker = options.checker || defaultChecker;
  const filter = options.filter || null;
  const allowDuplicate = options.allowDuplicate || null;
  const find = options.removeFromFirst ? lodash.findLastIndex : lodash.findIndex;
  const runtimeCache = {
    checker,
    filter,
    allowDuplicate,
    // @ts-ignore
    find
  };
  const cb = (elementA, indexA, arr) => {
    if (allowDuplicate && allowDuplicate(elementA, indexA, arr, runtimeCache)) {
      return !filter || filter(elementA, indexA, arr, runtimeCache);
    }
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
function defaultChecker(elementA, elementB, _indexA, _indexB, _arr, _runtimeCache) {
  return _equals(elementA, elementB);
}

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
function array_unique(arr, options = {}) {
  if (!Array.isArray(arr)) {
    throw new TypeError(`Expected an Array but got ${typeof arr}.`);
  }
  const cb = defaultFilter(options);
  if (options.overwrite) {
    let index = arr.length;
    while (index--) {
      let val = arr[index];
      if (!cb(val, index, arr)) {
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
function array_unique_overwrite(arr, options = {}) {
  return array_unique(arr, {
    ...options,
    overwrite: true
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

// @ts-ignore
function lazy_unique(...arr) {
  if (arr.length > 1) {
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
function lazy_unique_overwrite(...arr) {
  if (arr.length > 1) {
    return array_unique_overwrite(arr);
  }
  return array_unique_overwrite(arr[0]);
}
{
  Object.defineProperty(lazy_unique, "array_unique", {
    value: array_unique
  });
  Object.defineProperty(lazy_unique, "array_unique_overwrite", {
    value: array_unique_overwrite
  });
  Object.defineProperty(lazy_unique, "lazy_unique_overwrite", {
    value: lazy_unique_overwrite
  });
  Object.defineProperty(lazy_unique, "equals", {
    value: equals
  });
  Object.defineProperty(lazy_unique, "defaultFilter", {
    value: defaultFilter
  });
  Object.defineProperty(lazy_unique, "defaultChecker", {
    value: defaultChecker
  });
  Object.defineProperty(lazy_unique, "lazy_unique", {
    value: lazy_unique
  });
  Object.defineProperty(lazy_unique, "default", {
    value: lazy_unique
  });
  Object.defineProperty(lazy_unique, "__esModule", {
    value: true
  });
}

/**
 * 以 CommonJS 的 `export =` 形式導出，使 require() 直接取得函式本體，
 * 與 ESM 的預設導出維持相同的使用方式。
 */
// @ts-ignore
module.exports = lazy_unique;
//# sourceMappingURL=index.cjs.development.cjs.map
