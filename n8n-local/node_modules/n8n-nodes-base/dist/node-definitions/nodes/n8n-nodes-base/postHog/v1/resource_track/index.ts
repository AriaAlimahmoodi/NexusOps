/**
 * PostHog - Track Resource
 * Re-exports all operation types for this resource.
 */

import type { PostHogV1TrackPageNode } from './operation_page';
import type { PostHogV1TrackScreenNode } from './operation_screen';

export * from './operation_page';
export * from './operation_screen';

export type PostHogV1TrackNode =
  | PostHogV1TrackPageNode
  | PostHogV1TrackScreenNode
  ;