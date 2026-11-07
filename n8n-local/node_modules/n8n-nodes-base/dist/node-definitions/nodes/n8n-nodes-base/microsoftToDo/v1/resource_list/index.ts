/**
 * Microsoft To Do - List Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftToDoV1ListCreateNode } from './operation_create';
import type { MicrosoftToDoV1ListDeleteNode } from './operation_delete';
import type { MicrosoftToDoV1ListGetNode } from './operation_get';
import type { MicrosoftToDoV1ListGetAllNode } from './operation_get_all';
import type { MicrosoftToDoV1ListUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftToDoV1ListNode =
  | MicrosoftToDoV1ListCreateNode
  | MicrosoftToDoV1ListDeleteNode
  | MicrosoftToDoV1ListGetNode
  | MicrosoftToDoV1ListGetAllNode
  | MicrosoftToDoV1ListUpdateNode
  ;