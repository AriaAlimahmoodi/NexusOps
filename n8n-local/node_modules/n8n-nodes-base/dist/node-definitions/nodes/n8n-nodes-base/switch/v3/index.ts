/**
 * Switch Node - Version 3
 * Re-exports all discriminator combinations.
 */

import type { SwitchV3ExpressionNode } from './mode_expression';
import type { SwitchV3RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV3Node =
  | SwitchV3ExpressionNode
  | SwitchV3RulesNode
  ;