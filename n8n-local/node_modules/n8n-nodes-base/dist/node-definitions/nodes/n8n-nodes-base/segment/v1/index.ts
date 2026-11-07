/**
 * Segment Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SegmentV1GroupNode } from './resource_group';
import type { SegmentV1IdentifyNode } from './resource_identify';
import type { SegmentV1TrackNode } from './resource_track';

export * from './resource_group';
export * from './resource_identify';
export * from './resource_track';

export type SegmentV1Node =
  | SegmentV1GroupNode
  | SegmentV1IdentifyNode
  | SegmentV1TrackNode
  ;