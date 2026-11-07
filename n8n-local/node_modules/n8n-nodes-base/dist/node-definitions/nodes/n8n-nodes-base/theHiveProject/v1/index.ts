/**
 * TheHive 5 Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TheHiveProjectV1AlertNode } from './resource_alert';
import type { TheHiveProjectV1CaseNode } from './resource_case';
import type { TheHiveProjectV1CommentNode } from './resource_comment';
import type { TheHiveProjectV1ObservableNode } from './resource_observable';
import type { TheHiveProjectV1PageNode } from './resource_page';
import type { TheHiveProjectV1QueryNode } from './resource_query';
import type { TheHiveProjectV1TaskNode } from './resource_task';
import type { TheHiveProjectV1LogNode } from './resource_log';

export * from './resource_alert';
export * from './resource_case';
export * from './resource_comment';
export * from './resource_observable';
export * from './resource_page';
export * from './resource_query';
export * from './resource_task';
export * from './resource_log';

export type TheHiveProjectV1Node =
  | TheHiveProjectV1AlertNode
  | TheHiveProjectV1CaseNode
  | TheHiveProjectV1CommentNode
  | TheHiveProjectV1ObservableNode
  | TheHiveProjectV1PageNode
  | TheHiveProjectV1QueryNode
  | TheHiveProjectV1TaskNode
  | TheHiveProjectV1LogNode
  ;