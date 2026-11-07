/**
 * Salesforce - Attachment Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1AttachmentCreateNode } from './operation_create';
import type { SalesforceV1AttachmentDeleteNode } from './operation_delete';
import type { SalesforceV1AttachmentGetNode } from './operation_get';
import type { SalesforceV1AttachmentGetAllNode } from './operation_get_all';
import type { SalesforceV1AttachmentGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1AttachmentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';

export type SalesforceV1AttachmentNode =
  | SalesforceV1AttachmentCreateNode
  | SalesforceV1AttachmentDeleteNode
  | SalesforceV1AttachmentGetNode
  | SalesforceV1AttachmentGetAllNode
  | SalesforceV1AttachmentGetSummaryNode
  | SalesforceV1AttachmentUpdateNode
  ;