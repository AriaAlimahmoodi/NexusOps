/**
 * Linear Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { LinearV11CommentNode } from './resource_comment';
import type { LinearV11IssueNode } from './resource_issue';

export * from './resource_comment';
export * from './resource_issue';

export type LinearV11Node =
  | LinearV11CommentNode
  | LinearV11IssueNode
  ;