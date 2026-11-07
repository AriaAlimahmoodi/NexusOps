/**
 * Stripe - Coupon Resource
 * Re-exports all operation types for this resource.
 */

import type { StripeV1CouponCreateNode } from './operation_create';
import type { StripeV1CouponGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type StripeV1CouponNode =
  | StripeV1CouponCreateNode
  | StripeV1CouponGetAllNode
  ;