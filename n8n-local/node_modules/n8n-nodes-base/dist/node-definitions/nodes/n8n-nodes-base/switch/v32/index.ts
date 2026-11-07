/**
 * Switch Node - Version 3.2
 * Re-exports all discriminator combinations.
 */

import type { SwitchV32ExpressionNode } from './mode_expression';
import type { SwitchV32RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV32Node =
  | SwitchV32ExpressionNode
  | SwitchV32RulesNode
  ;