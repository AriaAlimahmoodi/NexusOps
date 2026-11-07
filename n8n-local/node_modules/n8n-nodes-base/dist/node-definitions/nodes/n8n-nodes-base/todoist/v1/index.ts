/**
 * Todoist Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TodoistV1TaskNode } from './resource_task';

export * from './resource_task';

export type TodoistV1Node = TodoistV1TaskNode;