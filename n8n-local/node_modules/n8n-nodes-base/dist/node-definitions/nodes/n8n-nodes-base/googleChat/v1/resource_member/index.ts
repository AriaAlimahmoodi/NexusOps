/**
 * Google Chat - Member Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleChatV1MemberGetNode } from './operation_get';
import type { GoogleChatV1MemberGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleChatV1MemberNode =
  | GoogleChatV1MemberGetNode
  | GoogleChatV1MemberGetAllNode
  ;