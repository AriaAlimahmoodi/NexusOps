/**
 * TheHive 5 - Observable Resource
 * Re-exports all operation types for this resource.
 */

import type { TheHiveProjectV1ObservableCreateNode } from './operation_create';
import type { TheHiveProjectV1ObservableDeleteObservableNode } from './operation_delete_observable';
import type { TheHiveProjectV1ObservableExecuteAnalyzerNode } from './operation_execute_analyzer';
import type { TheHiveProjectV1ObservableExecuteResponderNode } from './operation_execute_responder';
import type { TheHiveProjectV1ObservableGetNode } from './operation_get';
import type { TheHiveProjectV1ObservableSearchNode } from './operation_search';
import type { TheHiveProjectV1ObservableUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_observable';
export * from './operation_execute_analyzer';
export * from './operation_execute_responder';
export * from './operation_get';
export * from './operation_search';
export * from './operation_update';

export type TheHiveProjectV1ObservableNode =
  | TheHiveProjectV1ObservableCreateNode
  | TheHiveProjectV1ObservableDeleteObservableNode
  | TheHiveProjectV1ObservableExecuteAnalyzerNode
  | TheHiveProjectV1ObservableExecuteResponderNode
  | TheHiveProjectV1ObservableGetNode
  | TheHiveProjectV1ObservableSearchNode
  | TheHiveProjectV1ObservableUpdateNode
  ;