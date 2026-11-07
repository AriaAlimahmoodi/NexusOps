/**
 * Switch Node - Version 3.4
 * Re-exports all discriminator combinations.
 */

import type { SwitchV34ExpressionNode } from './mode_expression';
import type { SwitchV34RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV34Node =
  | SwitchV34ExpressionNode
  | SwitchV34RulesNode
  ;