/**
 * Pipedrive - DealActivity Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1DealActivityGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type PipedriveV1DealActivityNode = PipedriveV1DealActivityGetAllNode;