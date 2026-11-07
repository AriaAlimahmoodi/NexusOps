/**
 * Switch Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { SwitchV2ExpressionNode } from './mode_expression';
import type { SwitchV2RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV2Node =
  | SwitchV2ExpressionNode
  | SwitchV2RulesNode
  ;