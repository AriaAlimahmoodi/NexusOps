/**
 * Strava - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { StravaV11ActivityCreateNode } from './operation_create';
import type { StravaV11ActivityGetNode } from './operation_get';
import type { StravaV11ActivityGetAllNode } from './operation_get_all';
import type { StravaV11ActivityGetCommentsNode } from './operation_get_comments';
import type { StravaV11ActivityGetKudosNode } from './operation_get_kudos';
import type { StravaV11ActivityGetLapsNode } from './operation_get_laps';
import type { StravaV11ActivityGetStreamsNode } from './operation_get_streams';
import type { StravaV11ActivityGetZonesNode } from './operation_get_zones';
import type { StravaV11ActivityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_comments';
export * from './operation_get_kudos';
export * from './operation_get_laps';
export * from './operation_get_streams';
export * from './operation_get_zones';
export * from './operation_update';

export type StravaV11ActivityNode =
  | StravaV11ActivityCreateNode
  | StravaV11ActivityGetNode
  | StravaV11ActivityGetAllNode
  | StravaV11ActivityGetCommentsNode
  | StravaV11ActivityGetKudosNode
  | StravaV11ActivityGetLapsNode
  | StravaV11ActivityGetStreamsNode
  | StravaV11ActivityGetZonesNode
  | StravaV11ActivityUpdateNode
  ;