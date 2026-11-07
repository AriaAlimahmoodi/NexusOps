/**
 * Uplead - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { UpleadV1CompanyEnrichNode } from './operation_enrich';

export * from './operation_enrich';

export type UpleadV1CompanyNode = UpleadV1CompanyEnrichNode;