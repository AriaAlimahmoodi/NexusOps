/**
 * Contentful - Locale Resource
 * Re-exports all operation types for this resource.
 */

import type { ContentfulV1LocaleGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ContentfulV1LocaleNode = ContentfulV1LocaleGetAllNode;