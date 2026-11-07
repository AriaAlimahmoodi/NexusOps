# array-hyper-unique

取得陣列唯一值，支援深度比較巢狀物件和陣列。/ Get unique values from array with deep comparison for nested objects and arrays.

[API](index.d.ts)

## 簡介 / Introduction

此模組基於 [arr-unique](https://www.npmjs.com/package/arr-unique) 進行開發。/
This module is based on [arr-unique](https://www.npmjs.com/package/arr-unique).

1. 重新使用 TypeScript 編寫並修復問題 / Rewrite to TypeScript and fix bugs
2. 增加選項控制 / Add option control
3. 詳細用法請參考 [_data.ts](test/_data.ts)、[test.test.ts](test/test.test.ts) 或 [lib.chk.ts](test/lib.chk.ts)

---

## 安裝 / Install

```bash
yarn add array-hyper-unique
yarn-tool add array-hyper-unique
yt add array-hyper-unique
```

## 應用情境 / Application Scenarios

1. **去除複雜物件重複項**: 處理巢狀物件和陣列的深度去重
2. **API 資料處理**: 清理 API 回傳的重複資料
3. **表單驗證**: 檢查使用者提交的重複選項
4. **資料合併**: 合併多個資料源並去除重複

## 效能比較 / Performance Comparison

```json5
{ 'array-hyper-unique': { success: 15, fail: 0, error: 0 },
  'array-unique-deep': { success: 11, fail: 4, error: 0 },
  'array-uniq': { success: 7, fail: 8, error: 0 },
  'just-unique': { success: 7, fail: 8, error: 0 },
  'arr-unique': { success: 7, fail: 8, error: 0 },
  'lodash.uniq': { success: 7, fail: 8, error: 0 },
  'array-unique': { success: 6, fail: 9, error: 0 },
  '@arr/unique': { success: 6, fail: 9, error: 0 },
  'tfk-unique-array': { success: 5, fail: 6, error: 4 } }
```

## 示範 / Demo

[demo.ts](test/demo.ts)

```ts
import { array_unique, default as lazy_unique } from 'array-hyper-unique';

_testIt([
		1,
		0,
		true,
		undefined,
		null,
		false,
		['a', 'b', 'c'],
		['a', 'b', 'c'],
		['a', 'c', 'b'],
		{ a: { b: 2 } },
		{ a: { b: 2 } },
		{ a: { b: 3 } },
		{ a: { b: undefined } },
		{ a: {  } },
		{ a: { b: 3, c: undefined } },
	])
;

_testIt(
	[{a: {b: 2}}, {a: {b: 2}}, {a: {b: 3}}],
);

_testIt(
	[1, 2, 3, 3],
);

_testIt(
	[['a', 'b', 'c'], ['a', 'b', 'c'],],
);

function _testIt(data)
{
	let actual = array_unique(data);

	let actual2;

	if (Array.isArray(data))
	{
		actual2 = lazy_unique(...data);
	}
	else
	{
		actual2 = lazy_unique(data);
	}

	console.log(`========= input =========`);

	console.dir(data);

	console.log(`--------- array_unique ---------`);
	console.dir(actual);

	console.log(`--------- lazy_unique ---------`);
	console.dir(actual2);
}
```

```ts
========= input =========
[ 1,
  0,
  true,
  undefined,
  null,
  false,
  [ 'a', 'b', 'c' ],
  [ 'a', 'b', 'c' ],
  [ 'a', 'c', 'b' ],
  { a: { b: 2 } },
  { a: { b: 2 } },
  { a: { b: 3 } },
  { a: { b: undefined } },
  { a: {} },
  { a: { b: 3, c: undefined } } ]
--------- array_unique ---------
[ 1,
  0,
  true,
  undefined,
  null,
  false,
  [ 'a', 'b', 'c' ],
  [ 'a', 'c', 'b' ],
  { a: { b: 2 } },
  { a: { b: 3 } },
  { a: { b: undefined } },
  { a: {} },
  { a: { b: 3, c: undefined } } ]
--------- lazy_unique ---------
[ 1,
  0,
  true,
  undefined,
  null,
  false,
  [ 'a', 'b', 'c' ],
  [ 'a', 'c', 'b' ],
  { a: { b: 2 } },
  { a: { b: 3 } },
  { a: { b: undefined } },
  { a: {} },
  { a: { b: 3, c: undefined } } ]
========= input =========
[ { a: { b: 2 } }, { a: { b: 2 } }, { a: { b: 3 } } ]
--------- array_unique ---------
[ { a: { b: 2 } }, { a: { b: 3 } } ]
--------- lazy_unique ---------
[ { a: { b: 2 } }, { a: { b: 3 } } ]
========= input =========
[ 1, 2, 3, 3 ]
--------- array_unique ---------
[ 1, 2, 3 ]
--------- lazy_unique ---------
[ 1, 2, 3 ]
========= input =========
[ [ 'a', 'b', 'c' ], [ 'a', 'b', 'c' ] ]
--------- array_unique ---------
[ [ 'a', 'b', 'c' ] ]
--------- lazy_unique ---------
[ [ 'a', 'b', 'c' ] ]
```

## 選項 / Options

```ts
array_unique(arr_input, {
	// 自訂相等性檢查 / custom equality check
	checker(elementA, elementB, indexA, indexB, arr, runtimeCache)
	{
		let bool: boolean;

		// do equal check

		return bool;
	},

	// 最終保留條件 / final keep condition
	filter(elementA, indexA, arr, runtimeCache)
	{
		let bool: boolean;

		// do keep check

		return bool;
	},

	// 允許某些值保留重複項 / allow certain values to keep duplicates
	allowDuplicate(elementA, indexA, arr, runtimeCache)
	{
		return elementA === '';
	},

	// overwrite source array
	overwrite: true,

	// 移除「較早」出現的重複項（保留最後一次）/ remove the earlier duplicates (keep the last occurrence)
	removeFromFirst: true,
})
```

### 三個 callback 的職責

| 選項 / Option | 回答的問題 / Question | 說明 / Note |
| --- | --- | --- |
| `allowDuplicate` | 要不要檢查 / *whether* to check | 回傳 true 即略過唯一性判斷 / returning true skips the uniqueness check |
| `checker` | 怎麼算相同 / *how* equality is determined | 唯一性判斷採用的相等性規則 / the equality rule used by the uniqueness check |
| `filter` | 要不要保留 / *whether* to keep | 不論前兩者回傳什麼，它都是最終保留條件 / the final keep condition regardless of the two above |

`allowDuplicate` 最先被呼叫，`filter` 永遠最後被呼叫。/ `allowDuplicate` is invoked first and `filter` is always invoked last.

### checker 的參數順序 / Parameter order of checker

呼叫形式固定為 / The call form is always:

```ts
find(arr, (elementB, indexB) => checker(elementA, elementB, indexA, indexB, arr, runtimeCache))
```

- `elementA` / `indexA` 是正在被檢查的元素（外層 `cb` 的參數），同一次判斷中固定不變 / the element being checked; fixed within one comparison
- `elementB` / `indexB` 是 find 逐一掃描到的候選位置，每次呼叫都會推進 / the candidate position scanned by find; advances on every call

因此呼叫次數與順序取決於 find 的掃描方向 / So the call count and order depend on the scan direction of find:

- `removeFromFirst: false` → `findIndex`（由頭往尾 / head to tail）
- `removeFromFirst: true` → `findLastIndex`（由尾往頭 / tail to head）

兩者都在遇到第一個回傳 true 時停止。/ Both stop at the first `true`.

### runtimeCache

每個 callback 的最後一個參數都是同一個執行期快取 (Runtime Cache) 物件，由 `defaultFilter` 在建立 callback 前解析一次，內含本次去重實際採用的 `checker` / `filter` / `allowDuplicate` 與 `find` 實作，且為唯讀（更改內容不會影響已建立的 callback）。

The last parameter of every callback is the same readonly runtime cache object, resolved once before the callbacks are created. It holds the `checker` / `filter` / `allowDuplicate` and the `find` implementation actually used by this run; mutating it does not affect already-created callbacks.

### 決策流程 / Decision Flow

```text
array_unique(arr, options)
  ├─ !Array.isArray(arr) ──> throw TypeError
  ├─ defaultFilter(options)
  │    ├─ find = removeFromFirst ? findLastIndex : findIndex
  │    └─ runtimeCache = { checker, filter, allowDuplicate, find }
  ├─ overwrite = true  ──> 從尾到頭逐項呼叫 cb，回傳 false 則 splice 就地移除
  └─ overwrite = false ──> arr.filter(cb)，回傳 false 則不加入新陣列

cb(elementA, indexA, arr)（兩種模式共用同一套決策）
  ① allowDuplicate(elementA, indexA, arr, runtimeCache) ?
  │    ├─ false ──> ②
  │    └─ true  ──> ③（略過 ② 與 checker 比對）
  ② i = find(arr, (elementB, indexB) => checker(elementA, elementB, indexA, indexB, arr, runtimeCache))
  │    └─ i === indexA（elementA 是否為基準位置）
  │         ├─ false ──> ✗ 移除（重複項）
  │         └─ true  ──> ③
  ③ filter(elementA, indexA, arr, runtimeCache) ?
       ├─ true  ──> ✓ 保留
       └─ false ──> ✗ 移除
```

`array_unique_overwrite(arr, options)` 等同於 `array_unique(arr, { ...options, overwrite: true })`。

### 範例

以 `['# a', '*.log', '*.log', '', '# b', '', '*.log', '']` 為例，允許空字串重複 / Given `['# a', '*.log', '*.log', '', '# b', '', '*.log', '']`, allow `''` to repeat:

```ts
array_unique(lines, { allowDuplicate: (v) => v === '' });
// => ['# a', '*.log', '', '# b', '', '']
```

搭配 `checker`（不分大小寫）與 `removeFromFirst`，同一份輸入的結果會不同 / Combined with a case-insensitive `checker` and `removeFromFirst`, the same input yields a different result:

```ts
array_unique(lines, {
	checker: (elementA, elementB) => elementA.toLowerCase() === elementB.toLowerCase(),
	removeFromFirst: true,
	allowDuplicate: (v) => v === '',
});
// => ['# a', '', '# b', '', '*.log', '']
```

詳細可對照 [allow-duplicate.node-test.ts](test/allow-duplicate.node-test.ts)、[remove-from-first.spec.ts](test/remove-from-first.spec.ts) 與 [filter.test.ts](test/filter.test.ts)。/ See [allow-duplicate.node-test.ts](test/allow-duplicate.node-test.ts), [remove-from-first.spec.ts](test/remove-from-first.spec.ts) and [filter.test.ts](test/filter.test.ts) for the expected results.

## 與其他模組的差異 / Differences from Other Modules

```bash
node --run test:lib-chk
```

[lib.chk.ts](test/lib.chk.ts)

---

```
[LOG] main mixin test
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[ERROR] tfk-unique-array Unexpected token u in JSON at position 0
[FAIL] just-unique
[FAIL] arr-unique
[FAIL] array-unique-deep
[FAIL] lodash.uniq


[LOG] object
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[SUCCESS] tfk-unique-array
[FAIL] just-unique
[SUCCESS] arr-unique
[SUCCESS] array-unique-deep
[FAIL] lodash.uniq


[LOG] number
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[SUCCESS] array-unique
[SUCCESS] @arr/unique
[SUCCESS] tfk-unique-array
[SUCCESS] just-unique
[SUCCESS] arr-unique
[SUCCESS] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] number 2
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[FAIL] tfk-unique-array
[SUCCESS] just-unique
[FAIL] arr-unique
[SUCCESS] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] string
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[SUCCESS] array-unique
[SUCCESS] @arr/unique
[SUCCESS] tfk-unique-array
[SUCCESS] just-unique
[SUCCESS] arr-unique
[SUCCESS] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] string[]
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[SUCCESS] tfk-unique-array
[FAIL] just-unique
[FAIL] arr-unique
[SUCCESS] array-unique-deep
[FAIL] lodash.uniq


[LOG] RegExp
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[FAIL] tfk-unique-array
[FAIL] just-unique
[FAIL] arr-unique
[SUCCESS] array-unique-deep
[FAIL] lodash.uniq


[LOG] boolean
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[SUCCESS] array-unique
[SUCCESS] @arr/unique
[SUCCESS] tfk-unique-array
[SUCCESS] just-unique
[SUCCESS] arr-unique
[SUCCESS] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] boolean 2
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[SUCCESS] array-unique
[SUCCESS] @arr/unique
[ERROR] tfk-unique-array Unexpected token u in JSON at position 0
[SUCCESS] just-unique
[FAIL] arr-unique
[SUCCESS] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] Map
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[FAIL] tfk-unique-array
[FAIL] just-unique
[SUCCESS] arr-unique
[SUCCESS] array-unique-deep
[FAIL] lodash.uniq


[LOG] function
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[SUCCESS] array-unique
[SUCCESS] @arr/unique
[ERROR] tfk-unique-array Unexpected token u in JSON at position 0
[SUCCESS] just-unique
[SUCCESS] arr-unique
[FAIL] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] function 2
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[ERROR] tfk-unique-array Unexpected token u in JSON at position 0
[FAIL] just-unique
[SUCCESS] arr-unique
[FAIL] array-unique-deep
[FAIL] lodash.uniq


[LOG] Buffer
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[FAIL] tfk-unique-array
[FAIL] just-unique
[FAIL] arr-unique
[SUCCESS] array-unique-deep
[FAIL] lodash.uniq


[LOG] ArrayBuffer
--------------
[SUCCESS] array-hyper-unique
[SUCCESS] array-uniq
[SUCCESS] array-unique
[SUCCESS] @arr/unique
[FAIL] tfk-unique-array
[SUCCESS] just-unique
[FAIL] arr-unique
[FAIL] array-unique-deep
[SUCCESS] lodash.uniq


[LOG] Buffer & ArrayBuffer
--------------
[SUCCESS] array-hyper-unique
[FAIL] array-uniq
[FAIL] array-unique
[FAIL] @arr/unique
[FAIL] tfk-unique-array
[FAIL] just-unique
[FAIL] arr-unique
[SUCCESS] array-unique-deep
[FAIL] lodash.uniq


---

```js
{
  'array-hyper-unique': { success: 15, fail: 0, error: 0 },
  'array-unique-deep': { success: 11, fail: 4, error: 0 },
  'array-uniq': { success: 7, fail: 8, error: 0 },
  'just-unique': { success: 7, fail: 8, error: 0 },
  'arr-unique': { success: 7, fail: 8, error: 0 },
  'lodash.uniq': { success: 7, fail: 8, error: 0 },
  'array-unique': { success: 6, fail: 9, error: 0 },
  '@arr/unique': { success: 6, fail: 9, error: 0 },
  'tfk-unique-array': { success: 5, fail: 6, error: 4 }
}
```

