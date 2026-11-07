/**
 * Currents - TestResult Resource
 * Re-exports all operation types for this resource.
 */

import type { CurrentsV1TestResultGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type CurrentsV1TestResultNode = CurrentsV1TestResultGetAllNode;