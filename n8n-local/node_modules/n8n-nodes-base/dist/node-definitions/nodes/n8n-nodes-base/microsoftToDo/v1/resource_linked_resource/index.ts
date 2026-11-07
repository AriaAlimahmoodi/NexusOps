/**
 * Microsoft To Do - LinkedResource Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftToDoV1LinkedResourceCreateNode } from './operation_create';
import type { MicrosoftToDoV1LinkedResourceDeleteNode } from './operation_delete';
import type { MicrosoftToDoV1LinkedResourceGetNode } from './operation_get';
import type { MicrosoftToDoV1LinkedResourceGetAllNode } from './operation_get_all';
import type { MicrosoftToDoV1LinkedResourceUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftToDoV1LinkedResourceNode =
  | MicrosoftToDoV1LinkedResourceCreateNode
  | MicrosoftToDoV1LinkedResourceDeleteNode
  | MicrosoftToDoV1LinkedResourceGetNode
  | MicrosoftToDoV1LinkedResourceGetAllNode
  | MicrosoftToDoV1LinkedResourceUpdateNode
  ;