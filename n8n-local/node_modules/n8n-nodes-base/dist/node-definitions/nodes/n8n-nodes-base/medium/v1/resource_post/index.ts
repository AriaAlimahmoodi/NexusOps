/**
 * Medium - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { MediumV1PostCreateNode } from './operation_create';

export * from './operation_create';

export type MediumV1PostNode = MediumV1PostCreateNode;