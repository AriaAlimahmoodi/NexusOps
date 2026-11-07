/**
 * Customer.io - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { CustomerIoV1EventTrackNode } from './operation_track';
import type { CustomerIoV1EventTrackAnonymousNode } from './operation_track_anonymous';

export * from './operation_track';
export * from './operation_track_anonymous';

export type CustomerIoV1EventNode =
  | CustomerIoV1EventTrackNode
  | CustomerIoV1EventTrackAnonymousNode
  ;