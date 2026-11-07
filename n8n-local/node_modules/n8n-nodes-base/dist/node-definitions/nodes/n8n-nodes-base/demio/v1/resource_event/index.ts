/**
 * Demio - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { DemioV1EventGetNode } from './operation_get';
import type { DemioV1EventGetAllNode } from './operation_get_all';
import type { DemioV1EventRegisterNode } from './operation_register';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_register';

export type DemioV1EventNode =
  | DemioV1EventGetNode
  | DemioV1EventGetAllNode
  | DemioV1EventRegisterNode
  ;