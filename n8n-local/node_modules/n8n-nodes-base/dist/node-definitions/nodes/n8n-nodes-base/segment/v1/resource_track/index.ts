/**
 * Segment - Track Resource
 * Re-exports all operation types for this resource.
 */

import type { SegmentV1TrackEventNode } from './operation_event';
import type { SegmentV1TrackPageNode } from './operation_page';

export * from './operation_event';
export * from './operation_page';

export type SegmentV1TrackNode =
  | SegmentV1TrackEventNode
  | SegmentV1TrackPageNode
  ;