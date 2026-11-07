/**
 * Matrix - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { MatrixV1EventGetNode } from './operation_get';

export * from './operation_get';

export type MatrixV1EventNode = MatrixV1EventGetNode;