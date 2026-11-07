/**
 * Strava - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { StravaV1ActivityCreateNode } from './operation_create';
import type { StravaV1ActivityGetNode } from './operation_get';
import type { StravaV1ActivityGetAllNode } from './operation_get_all';
import type { StravaV1ActivityGetCommentsNode } from './operation_get_comments';
import type { StravaV1ActivityGetKudosNode } from './operation_get_kudos';
import type { StravaV1ActivityGetLapsNode } from './operation_get_laps';
import type { StravaV1ActivityGetStreamsNode } from './operation_get_streams';
import type { StravaV1ActivityGetZonesNode } from './operation_get_zones';
import type { StravaV1ActivityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_comments';
export * from './operation_get_kudos';
export * from './operation_get_laps';
export * from './operation_get_streams';
export * from './operation_get_zones';
export * from './operation_update';

export type StravaV1ActivityNode =
  | StravaV1ActivityCreateNode
  | StravaV1ActivityGetNode
  | StravaV1ActivityGetAllNode
  | StravaV1ActivityGetCommentsNode
  | StravaV1ActivityGetKudosNode
  | StravaV1ActivityGetLapsNode
  | StravaV1ActivityGetStreamsNode
  | StravaV1ActivityGetZonesNode
  | StravaV1ActivityUpdateNode
  ;