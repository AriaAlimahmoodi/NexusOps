/**
 * Todoist Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { TodoistV21TaskNode } from './resource_task';
import type { TodoistV21ProjectNode } from './resource_project';
import type { TodoistV21SectionNode } from './resource_section';
import type { TodoistV21CommentNode } from './resource_comment';
import type { TodoistV21LabelNode } from './resource_label';
import type { TodoistV21ReminderNode } from './resource_reminder';

export * from './resource_task';
export * from './resource_project';
export * from './resource_section';
export * from './resource_comment';
export * from './resource_label';
export * from './resource_reminder';

export type TodoistV21Node =
  | TodoistV21TaskNode
  | TodoistV21ProjectNode
  | TodoistV21SectionNode
  | TodoistV21CommentNode
  | TodoistV21LabelNode
  | TodoistV21ReminderNode
  ;