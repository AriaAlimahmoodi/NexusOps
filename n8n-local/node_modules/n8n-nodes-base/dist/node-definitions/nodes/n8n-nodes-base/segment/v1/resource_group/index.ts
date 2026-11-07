/**
 * Segment - Group Resource
 * Re-exports all operation types for this resource.
 */

import type { SegmentV1GroupAddNode } from './operation_add';

export * from './operation_add';

export type SegmentV1GroupNode = SegmentV1GroupAddNode;