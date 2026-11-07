/**
 * Paddle - Coupon Resource
 * Re-exports all operation types for this resource.
 */

import type { PaddleV1CouponCreateNode } from './operation_create';
import type { PaddleV1CouponGetAllNode } from './operation_get_all';
import type { PaddleV1CouponUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get_all';
export * from './operation_update';

export type PaddleV1CouponNode =
  | PaddleV1CouponCreateNode
  | PaddleV1CouponGetAllNode
  | PaddleV1CouponUpdateNode
  ;