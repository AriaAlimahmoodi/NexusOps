/**
 * Plivo - Call Resource
 * Re-exports all operation types for this resource.
 */

import type { PlivoV1CallMakeNode } from './operation_make';

export * from './operation_make';

export type PlivoV1CallNode = PlivoV1CallMakeNode;