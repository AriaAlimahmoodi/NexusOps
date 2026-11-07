/**
 * TheHive 5 - Case Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1CaseAddAttachmentNode } from './operation_add_attachment';
import type { TheHiveProjectV1CaseCreateNode } from './operation_create';
import type { TheHiveProjectV1CaseDeleteAttachmentNode } from './operation_delete_attachment';
import type { TheHiveProjectV1CaseDeleteCaseNode } from './operation_delete_case';
import type { TheHiveProjectV1CaseExecuteResponderNode } from './operation_execute_responder';
import type { TheHiveProjectV1CaseGetNode } from './operation_get';
import type { TheHiveProjectV1CaseGetAttachmentNode } from './operation_get_attachment';
import type { TheHiveProjectV1CaseGetTimelineNode } from './operation_get_timeline';
import type { TheHiveProjectV1CaseSearchNode } from './operation_search';
import type { TheHiveProjectV1CaseUpdateNode } from './operation_update';

export * from './operation_add_attachment';
export * from './operation_create';
export * from './operation_delete_attachment';
export * from './operation_delete_case';
export * from './operation_execute_responder';
export * from './operation_get';
export * from './operation_get_attachment';
export * from './operation_get_timeline';
export * from './operation_search';
export * from './operation_update';

export type TheHiveProjectV1CaseNode =
  | TheHiveProjectV1CaseAddAttachmentNode
  | TheHiveProjectV1CaseCreateNode
  | TheHiveProjectV1CaseDeleteAttachmentNode
  | TheHiveProjectV1CaseDeleteCaseNode
  | TheHiveProjectV1CaseExecuteResponderNode
  | TheHiveProjectV1CaseGetNode
  | TheHiveProjectV1CaseGetAttachmentNode
  | TheHiveProjectV1CaseGetTimelineNode
  | TheHiveProjectV1CaseSearchNode
  | TheHiveProjectV1CaseUpdateNode
  ;