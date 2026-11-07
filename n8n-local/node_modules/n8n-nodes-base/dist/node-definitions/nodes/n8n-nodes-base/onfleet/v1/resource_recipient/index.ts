/**
 * Onfleet - Recipient Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1RecipientCreateNode } from './operation_create';
import type { OnfleetV1RecipientGetNode } from './operation_get';
import type { OnfleetV1RecipientUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_update';

export type OnfleetV1RecipientNode =
  | OnfleetV1RecipientCreateNode
  | OnfleetV1RecipientGetNode
  | OnfleetV1RecipientUpdateNode
  ;