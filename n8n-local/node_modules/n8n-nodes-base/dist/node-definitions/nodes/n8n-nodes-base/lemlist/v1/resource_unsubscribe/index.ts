/**
 * Lemlist - Unsubscribe Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV1UnsubscribeAddNode } from './operation_add';
import type { LemlistV1UnsubscribeDeleteNode } from './operation_delete';
import type { LemlistV1UnsubscribeGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type LemlistV1UnsubscribeNode =
  | LemlistV1UnsubscribeAddNode
  | LemlistV1UnsubscribeDeleteNode
  | LemlistV1UnsubscribeGetAllNode
  ;