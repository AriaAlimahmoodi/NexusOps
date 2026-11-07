/**
 * Uplead - Person Resource
 * Re-exports all operation types for this resource.
 */

import type { UpleadV1PersonEnrichNode } from './operation_enrich';

export * from './operation_enrich';

export type UpleadV1PersonNode = UpleadV1PersonEnrichNode;