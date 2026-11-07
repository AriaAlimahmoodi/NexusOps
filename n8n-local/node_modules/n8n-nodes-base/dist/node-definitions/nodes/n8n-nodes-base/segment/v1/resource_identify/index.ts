/**
 * Segment - Identify Resource
 * Re-exports all operation types for this resource.
 */

import type { SegmentV1IdentifyCreateNode } from './operation_create';

export * from './operation_create';

export type SegmentV1IdentifyNode = SegmentV1IdentifyCreateNode;