/**
 * Yourls - Url Resource
 * Re-exports all operation types for this resource.
 */

import type { YourlsV1UrlExpandNode } from './operation_expand';
import type { YourlsV1UrlShortenNode } from './operation_shorten';
import type { YourlsV1UrlStatsNode } from './operation_stats';

export * from './operation_expand';
export * from './operation_shorten';
export * from './operation_stats';

export type YourlsV1UrlNode =
  | YourlsV1UrlExpandNode
  | YourlsV1UrlShortenNode
  | YourlsV1UrlStatsNode
  ;