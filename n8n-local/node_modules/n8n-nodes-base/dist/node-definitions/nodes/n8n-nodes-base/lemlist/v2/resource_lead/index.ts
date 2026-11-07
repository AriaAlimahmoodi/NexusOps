/**
 * Lemlist - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV2LeadCreateNode } from './operation_create';
import type { LemlistV2LeadDeleteNode } from './operation_delete';
import type { LemlistV2LeadGetNode } from './operation_get';
import type { LemlistV2LeadUnsubscribeNode } from './operation_unsubscribe';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_unsubscribe';

export type LemlistV2LeadNode =
  | LemlistV2LeadCreateNode
  | LemlistV2LeadDeleteNode
  | LemlistV2LeadGetNode
  | LemlistV2LeadUnsubscribeNode
  ;