/**
 * Lemlist - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV1LeadCreateNode } from './operation_create';
import type { LemlistV1LeadDeleteNode } from './operation_delete';
import type { LemlistV1LeadGetNode } from './operation_get';
import type { LemlistV1LeadUnsubscribeNode } from './operation_unsubscribe';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_unsubscribe';

export type LemlistV1LeadNode =
  | LemlistV1LeadCreateNode
  | LemlistV1LeadDeleteNode
  | LemlistV1LeadGetNode
  | LemlistV1LeadUnsubscribeNode
  ;