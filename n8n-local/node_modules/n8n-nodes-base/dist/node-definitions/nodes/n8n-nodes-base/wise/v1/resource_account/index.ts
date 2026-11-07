/**
 * Wise - Account Resource
 * Re-exports all operation types for this resource.
 */

import type { WiseV1AccountGetBalancesNode } from './operation_get_balances';
import type { WiseV1AccountGetCurrenciesNode } from './operation_get_currencies';
import type { WiseV1AccountGetStatementNode } from './operation_get_statement';

export * from './operation_get_balances';
export * from './operation_get_currencies';
export * from './operation_get_statement';

export type WiseV1AccountNode =
  | WiseV1AccountGetBalancesNode
  | WiseV1AccountGetCurrenciesNode
  | WiseV1AccountGetStatementNode
  ;