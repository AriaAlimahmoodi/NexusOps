/**
 * Lemlist - Unsubscribe Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV2UnsubscribeAddNode } from './operation_add';
import type { LemlistV2UnsubscribeDeleteNode } from './operation_delete';
import type { LemlistV2UnsubscribeGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type LemlistV2UnsubscribeNode =
  | LemlistV2UnsubscribeAddNode
  | LemlistV2UnsubscribeDeleteNode
  | LemlistV2UnsubscribeGetAllNode
  ;