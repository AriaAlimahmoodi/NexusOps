/**
 * Linear Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LinearV1CommentNode } from './resource_comment';
import type { LinearV1IssueNode } from './resource_issue';

export * from './resource_comment';
export * from './resource_issue';

export type LinearV1Node =
  | LinearV1CommentNode
  | LinearV1IssueNode
  ;