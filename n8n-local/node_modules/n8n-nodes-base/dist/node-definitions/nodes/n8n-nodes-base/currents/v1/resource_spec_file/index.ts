/**
 * Currents - SpecFile Resource
 * Re-exports all operation types for this resource.
 */

import type { CurrentsV1SpecFileGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type CurrentsV1SpecFileNode = CurrentsV1SpecFileGetAllNode;