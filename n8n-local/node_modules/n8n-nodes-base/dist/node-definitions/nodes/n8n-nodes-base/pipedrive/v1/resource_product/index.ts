/**
 * Pipedrive - Product Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1ProductGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type PipedriveV1ProductNode = PipedriveV1ProductGetAllNode;