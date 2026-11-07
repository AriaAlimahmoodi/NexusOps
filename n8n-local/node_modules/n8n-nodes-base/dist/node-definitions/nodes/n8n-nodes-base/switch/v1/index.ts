/**
 * Switch Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SwitchV1ExpressionNode } from './mode_expression';
import type { SwitchV1RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV1Node =
  | SwitchV1ExpressionNode
  | SwitchV1RulesNode
  ;