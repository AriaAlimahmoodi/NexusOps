/**
 * Plivo - Mms Resource
 * Re-exports all operation types for this resource.
 */

import type { PlivoV1MmsSendNode } from './operation_send';

export * from './operation_send';

export type PlivoV1MmsNode = PlivoV1MmsSendNode;