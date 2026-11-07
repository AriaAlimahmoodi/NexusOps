/**
 * Microsoft To Do Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftToDoV1LinkedResourceNode } from './resource_linked_resource';
import type { MicrosoftToDoV1ListNode } from './resource_list';
import type { MicrosoftToDoV1TaskNode } from './resource_task';

export * from './resource_linked_resource';
export * from './resource_list';
export * from './resource_task';

export type MicrosoftToDoV1Node =
  | MicrosoftToDoV1LinkedResourceNode
  | MicrosoftToDoV1ListNode
  | MicrosoftToDoV1TaskNode
  ;