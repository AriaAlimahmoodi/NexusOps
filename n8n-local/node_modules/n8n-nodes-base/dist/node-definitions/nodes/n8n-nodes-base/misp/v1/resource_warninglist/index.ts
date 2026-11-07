/**
 * MISP - Warninglist Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1WarninglistGetNode } from './operation_get';
import type { MispV1WarninglistGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type MispV1WarninglistNode =
  | MispV1WarninglistGetNode
  | MispV1WarninglistGetAllNode
  ;