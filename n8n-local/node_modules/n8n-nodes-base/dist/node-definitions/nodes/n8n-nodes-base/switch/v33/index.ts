/**
 * Switch Node - Version 3.3
 * Re-exports all discriminator combinations.
 */

import type { SwitchV33ExpressionNode } from './mode_expression';
import type { SwitchV33RulesNode } from './mode_rules';

export * from './mode_expression';
export * from './mode_rules';

export type SwitchV33Node =
  | SwitchV33ExpressionNode
  | SwitchV33RulesNode
  ;