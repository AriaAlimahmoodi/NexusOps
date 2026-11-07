/**
 * Splunk - SearchResult Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV1SearchResultGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type SplunkV1SearchResultNode = SplunkV1SearchResultGetAllNode;