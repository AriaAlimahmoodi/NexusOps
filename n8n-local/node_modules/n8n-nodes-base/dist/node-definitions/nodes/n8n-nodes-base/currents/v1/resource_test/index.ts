/**
 * Currents - Test Resource
 * Re-exports all operation types for this resource.
 */

import type { CurrentsV1TestGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type CurrentsV1TestNode = CurrentsV1TestGetAllNode;