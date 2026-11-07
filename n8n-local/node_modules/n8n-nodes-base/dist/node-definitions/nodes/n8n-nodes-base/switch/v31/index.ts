/**
 * Switch Node - Version 3.1
 * Re-exports all discriminator combinations.
 */

import type { SwitchV31ExpressionNode } from './mode_expression';
import type { SwitchV31RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV31Node =
  | SwitchV31ExpressionNode
  | SwitchV31RulesNode
  ;