/**
 * Vero - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { VeroV1EventTrackNode } from './operation_track';

export * from './operation_track';

export type VeroV1EventNode = VeroV1EventTrackNode;