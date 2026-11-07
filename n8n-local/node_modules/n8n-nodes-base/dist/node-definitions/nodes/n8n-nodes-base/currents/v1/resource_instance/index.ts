/**
 * Currents - Instance Resource
 * Re-exports all operation types for this resource.
 */

import type { CurrentsV1InstanceGetNode } from './operation_get';

export * from './operation_get';

export type CurrentsV1InstanceNode = CurrentsV1InstanceGetNode;