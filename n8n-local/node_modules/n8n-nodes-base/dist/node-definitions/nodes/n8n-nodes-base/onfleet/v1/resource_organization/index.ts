/**
 * Onfleet - Organization Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1OrganizationGetNode } from './operation_get';
import type { OnfleetV1OrganizationGetDelegateeNode } from './operation_get_delegatee';

export * from './operation_get';
export * from './operation_get_delegatee';

export type OnfleetV1OrganizationNode =
  | OnfleetV1OrganizationGetNode
  | OnfleetV1OrganizationGetDelegateeNode
  ;