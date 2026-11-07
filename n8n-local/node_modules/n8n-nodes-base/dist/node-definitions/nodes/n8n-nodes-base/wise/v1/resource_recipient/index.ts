/**
 * Wise - Recipient Resource
 * Re-exports all operation types for this resource.
 */

import type { WiseV1RecipientGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type WiseV1RecipientNode = WiseV1RecipientGetAllNode;