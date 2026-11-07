/**
 * Stripe - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { StripeV1CustomerCreateNode } from './operation_create';
import type { StripeV1CustomerDeleteNode } from './operation_delete';
import type { StripeV1CustomerGetNode } from './operation_get';
import type { StripeV1CustomerGetAllNode } from './operation_get_all';
import type { StripeV1CustomerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type StripeV1CustomerNode =
  | StripeV1CustomerCreateNode
  | StripeV1CustomerDeleteNode
  | StripeV1CustomerGetNode
  | StripeV1CustomerGetAllNode
  | StripeV1CustomerUpdateNode
  ;