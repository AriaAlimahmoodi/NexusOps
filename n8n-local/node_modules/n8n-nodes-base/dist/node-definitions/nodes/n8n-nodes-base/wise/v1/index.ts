/**
 * Wise Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { WiseV1AccountNode } from './resource_account';
import type { WiseV1ExchangeRateNode } from './resource_exchange_rate';
import type { WiseV1ProfileNode } from './resource_profile';
import type { WiseV1QuoteNode } from './resource_quote';
import type { WiseV1RecipientNode } from './resource_recipient';
import type { WiseV1TransferNode } from './resource_transfer';

export * from './resource_account';
export * from './resource_exchange_rate';
export * from './resource_profile';
export * from './resource_quote';
export * from './resource_recipient';
export * from './resource_transfer';

export type WiseV1Node =
  | WiseV1AccountNode
  | WiseV1ExchangeRateNode
  | WiseV1ProfileNode
  | WiseV1QuoteNode
  | WiseV1RecipientNode
  | WiseV1TransferNode
  ;