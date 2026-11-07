/**
 * Customer.io - Segment Resource
 * Re-exports all operation types for this resource.
 */

import type { CustomerIoV1SegmentAddNode } from './operation_add';
import type { CustomerIoV1SegmentRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type CustomerIoV1SegmentNode =
  | CustomerIoV1SegmentAddNode
  | CustomerIoV1SegmentRemoveNode
  ;