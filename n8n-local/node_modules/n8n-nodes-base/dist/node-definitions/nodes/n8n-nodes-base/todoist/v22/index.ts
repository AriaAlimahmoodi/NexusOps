/**
 * Todoist Node - Version 2.2
 * Re-exports all discriminator combinations.
 */

import type { TodoistV22TaskNode } from './resource_task';
import type { TodoistV22ProjectNode } from './resource_project';
import type { TodoistV22SectionNode } from './resource_section';
import type { TodoistV22CommentNode } from './resource_comment';
import type { TodoistV22LabelNode } from './resource_label';
import type { TodoistV22ReminderNode } from './resource_reminder';

export * from './resource_task';
export * from './resource_project';
export * from './resource_section';
export * from './resource_comment';
export * from './resource_label';
export * from './resource_reminder';

export type TodoistV22Node =
  | TodoistV22TaskNode
  | TodoistV22ProjectNode
  | TodoistV22SectionNode
  | TodoistV22CommentNode
  | TodoistV22LabelNode
  | TodoistV22ReminderNode
  ;