/**
 * TheHive 5 - Alert Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1AlertCreateNode } from './operation_create';
import type { TheHiveProjectV1AlertDeleteAlertNode } from './operation_delete_alert';
import type { TheHiveProjectV1AlertExecuteResponderNode } from './operation_execute_responder';
import type { TheHiveProjectV1AlertGetNode } from './operation_get';
import type { TheHiveProjectV1AlertMergeNode } from './operation_merge';
import type { TheHiveProjectV1AlertPromoteNode } from './operation_promote';
import type { TheHiveProjectV1AlertSearchNode } from './operation_search';
import type { TheHiveProjectV1AlertStatusNode } from './operation_status';
import type { TheHiveProjectV1AlertUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_alert';
export * from './operation_execute_responder';
export * from './operation_get';
export * from './operation_merge';
export * from './operation_promote';
export * from './operation_search';
export * from './operation_status';
export * from './operation_update';

export type TheHiveProjectV1AlertNode =
  | TheHiveProjectV1AlertCreateNode
  | TheHiveProjectV1AlertDeleteAlertNode
  | TheHiveProjectV1AlertExecuteResponderNode
  | TheHiveProjectV1AlertGetNode
  | TheHiveProjectV1AlertMergeNode
  | TheHiveProjectV1AlertPromoteNode
  | TheHiveProjectV1AlertSearchNode
  | TheHiveProjectV1AlertStatusNode
  | TheHiveProjectV1AlertUpdateNode
  ;