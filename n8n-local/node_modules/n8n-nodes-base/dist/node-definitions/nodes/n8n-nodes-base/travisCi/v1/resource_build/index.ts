/**
 * TravisCI - Build Resource
 * Re-exports all operation types for this resource.
 */

import type { TravisCiV1BuildCancelNode } from './operation_cancel';
import type { TravisCiV1BuildGetNode } from './operation_get';
import type { TravisCiV1BuildGetAllNode } from './operation_get_all';
import type { TravisCiV1BuildRestartNode } from './operation_restart';
import type { TravisCiV1BuildTriggerNode } from './operation_trigger';

export * from './operation_cancel';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_restart';
export * from './operation_trigger';

export type TravisCiV1BuildNode =
  | TravisCiV1BuildCancelNode
  | TravisCiV1BuildGetNode
  | TravisCiV1BuildGetAllNode
  | TravisCiV1BuildRestartNode
  | TravisCiV1BuildTriggerNode
  ;