/**
 * TheHive 5 - Log Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1LogAddAttachmentNode } from './operation_add_attachment';
import type { TheHiveProjectV1LogCreateNode } from './operation_create';
import type { TheHiveProjectV1LogDeleteAttachmentNode } from './operation_delete_attachment';
import type { TheHiveProjectV1LogDeleteLogNode } from './operation_delete_log';
import type { TheHiveProjectV1LogExecuteResponderNode } from './operation_execute_responder';
import type { TheHiveProjectV1LogGetNode } from './operation_get';
import type { TheHiveProjectV1LogSearchNode } from './operation_search';

export * from './operation_add_attachment';
export * from './operation_create';
export * from './operation_delete_attachment';
export * from './operation_delete_log';
export * from './operation_execute_responder';
export * from './operation_get';
export * from './operation_search';

export type TheHiveProjectV1LogNode =
  | TheHiveProjectV1LogAddAttachmentNode
  | TheHiveProjectV1LogCreateNode
  | TheHiveProjectV1LogDeleteAttachmentNode
  | TheHiveProjectV1LogDeleteLogNode
  | TheHiveProjectV1LogExecuteResponderNode
  | TheHiveProjectV1LogGetNode
  | TheHiveProjectV1LogSearchNode
  ;