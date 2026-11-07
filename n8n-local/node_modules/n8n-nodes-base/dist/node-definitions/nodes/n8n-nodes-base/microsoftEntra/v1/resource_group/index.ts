/**
 * Microsoft Entra ID - Group Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftEntraV1GroupCreateNode } from './operation_create';
import type { MicrosoftEntraV1GroupDeleteNode } from './operation_delete';
import type { MicrosoftEntraV1GroupGetNode } from './operation_get';
import type { MicrosoftEntraV1GroupGetAllNode } from './operation_get_all';
import type { MicrosoftEntraV1GroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftEntraV1GroupNode =
  | MicrosoftEntraV1GroupCreateNode
  | MicrosoftEntraV1GroupDeleteNode
  | MicrosoftEntraV1GroupGetNode
  | MicrosoftEntraV1GroupGetAllNode
  | MicrosoftEntraV1GroupUpdateNode
  ;