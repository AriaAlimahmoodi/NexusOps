/**
 * Onfleet - Destination Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1DestinationCreateNode } from './operation_create';
import type { OnfleetV1DestinationGetNode } from './operation_get';

export * from './operation_create';
export * from './operation_get';

export type OnfleetV1DestinationNode =
  | OnfleetV1DestinationCreateNode
  | OnfleetV1DestinationGetNode
  ;