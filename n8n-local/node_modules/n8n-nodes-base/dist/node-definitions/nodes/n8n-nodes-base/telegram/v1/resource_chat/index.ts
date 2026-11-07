/**
 * Telegram - Chat Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV1ChatAdministratorsNode } from './operation_administrators';
import type { TelegramV1ChatGetNode } from './operation_get';
import type { TelegramV1ChatLeaveNode } from './operation_leave';
import type { TelegramV1ChatMemberNode } from './operation_member';
import type { TelegramV1ChatSetDescriptionNode } from './operation_set_description';
import type { TelegramV1ChatSetTitleNode } from './operation_set_title';

export * from './operation_administrators';
export * from './operation_get';
export * from './operation_leave';
export * from './operation_member';
export * from './operation_set_description';
export * from './operation_set_title';

export type TelegramV1ChatNode =
  | TelegramV1ChatAdministratorsNode
  | TelegramV1ChatGetNode
  | TelegramV1ChatLeaveNode
  | TelegramV1ChatMemberNode
  | TelegramV1ChatSetDescriptionNode
  | TelegramV1ChatSetTitleNode
  ;