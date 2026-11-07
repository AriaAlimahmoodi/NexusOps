/**
 * MessageBird Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MessageBirdV1SmsNode } from './resource_sms';
import type { MessageBirdV1BalanceNode } from './resource_balance';

export * from './resource_sms';
export * from './resource_balance';

export type MessageBirdV1Node =
  | MessageBirdV1SmsNode
  | MessageBirdV1BalanceNode
  ;