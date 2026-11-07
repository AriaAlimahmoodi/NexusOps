/**
 * Paddle Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PaddleV1CouponNode } from './resource_coupon';
import type { PaddleV1PaymentNode } from './resource_payment';
import type { PaddleV1PlanNode } from './resource_plan';
import type { PaddleV1ProductNode } from './resource_product';
import type { PaddleV1UserNode } from './resource_user';

export * from './resource_coupon';
export * from './resource_payment';
export * from './resource_plan';
export * from './resource_product';
export * from './resource_user';

export type PaddleV1Node =
  | PaddleV1CouponNode
  | PaddleV1PaymentNode
  | PaddleV1PlanNode
  | PaddleV1ProductNode
  | PaddleV1UserNode
  ;