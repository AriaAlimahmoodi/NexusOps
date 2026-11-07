/**
 * TheHive 5 - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1TaskCreateNode } from './operation_create';
import type { TheHiveProjectV1TaskDeleteTaskNode } from './operation_delete_task';
import type { TheHiveProjectV1TaskExecuteResponderNode } from './operation_execute_responder';
import type { TheHiveProjectV1TaskGetNode } from './operation_get';
import type { TheHiveProjectV1TaskSearchNode } from './operation_search';
import type { TheHiveProjectV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_task';
export * from './operation_execute_responder';
export * from './operation_get';
export * from './operation_search';
export * from './operation_update';

export type TheHiveProjectV1TaskNode =
  | TheHiveProjectV1TaskCreateNode
  | TheHiveProjectV1TaskDeleteTaskNode
  | TheHiveProjectV1TaskExecuteResponderNode
  | TheHiveProjectV1TaskGetNode
  | TheHiveProjectV1TaskSearchNode
  | TheHiveProjectV1TaskUpdateNode
  ;