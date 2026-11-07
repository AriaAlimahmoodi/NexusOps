/**
 * Lemlist - Team Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV2TeamGetNode } from './operation_get';
import type { LemlistV2TeamGetCreditsNode } from './operation_get_credits';

export * from './operation_get';
export * from './operation_get_credits';

export type LemlistV2TeamNode =
  | LemlistV2TeamGetNode
  | LemlistV2TeamGetCreditsNode
  ;