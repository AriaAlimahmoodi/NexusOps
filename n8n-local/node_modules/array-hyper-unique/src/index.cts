import { lazy_unique } from './index';

/**
 * 以 CommonJS 的 `export =` 形式導出，使 require() 直接取得函式本體，
 * 與 ESM 的預設導出維持相同的使用方式。
 */
// @ts-ignore
export = lazy_unique
