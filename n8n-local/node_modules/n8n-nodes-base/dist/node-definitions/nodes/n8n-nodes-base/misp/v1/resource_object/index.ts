/**
 * MISP - Object Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1ObjectSearchNode } from './operation_search';

export * from './operation_search';

export type MispV1ObjectNode = MispV1ObjectSearchNode;