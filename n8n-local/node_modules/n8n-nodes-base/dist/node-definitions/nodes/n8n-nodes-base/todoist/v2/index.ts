/**
 * Todoist Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { TodoistV2TaskNode } from './resource_task';
import type { TodoistV2ProjectNode } from './resource_project';
import type { TodoistV2SectionNode } from './resource_section';
import type { TodoistV2CommentNode } from './resource_comment';
import type { TodoistV2LabelNode } from './resource_label';
import type { TodoistV2ReminderNode } from './resource_reminder';

export * from './resource_task';
export * from './resource_project';
export * from './resource_section';
export * from './resource_comment';
export * from './resource_label';
export * from './resource_reminder';

export type TodoistV2Node =
  | TodoistV2TaskNode
  | TodoistV2ProjectNode
  | TodoistV2SectionNode
  | TodoistV2CommentNode
  | TodoistV2LabelNode
  | TodoistV2ReminderNode
  ;