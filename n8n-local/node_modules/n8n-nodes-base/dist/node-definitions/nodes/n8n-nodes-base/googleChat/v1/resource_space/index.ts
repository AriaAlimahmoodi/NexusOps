/**
 * Google Chat - Space Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleChatV1SpaceGetNode } from './operation_get';
import type { GoogleChatV1SpaceGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleChatV1SpaceNode =
  | GoogleChatV1SpaceGetNode
  | GoogleChatV1SpaceGetAllNode
  ;