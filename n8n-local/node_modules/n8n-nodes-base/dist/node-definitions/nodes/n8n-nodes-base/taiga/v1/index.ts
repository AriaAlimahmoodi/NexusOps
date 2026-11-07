/**
 * Taiga Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TaigaV1EpicNode } from './resource_epic';
import type { TaigaV1IssueNode } from './resource_issue';
import type { TaigaV1TaskNode } from './resource_task';
import type { TaigaV1UserStoryNode } from './resource_user_story';

export * from './resource_epic';
export * from './resource_issue';
export * from './resource_task';
export * from './resource_user_story';

export type TaigaV1Node =
  | TaigaV1EpicNode
  | TaigaV1IssueNode
  | TaigaV1TaskNode
  | TaigaV1UserStoryNode
  ;