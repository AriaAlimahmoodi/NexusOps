/**
 * Telegram - Chat Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV11ChatAdministratorsNode } from './operation_administrators';
import type { TelegramV11ChatGetNode } from './operation_get';
import type { TelegramV11ChatLeaveNode } from './operation_leave';
import type { TelegramV11ChatMemberNode } from './operation_member';
import type { TelegramV11ChatSetDescriptionNode } from './operation_set_description';
import type { TelegramV11ChatSetTitleNode } from './operation_set_title';

export * from './operation_administrators';
export * from './operation_get';
export * from './operation_leave';
export * from './operation_member';
export * from './operation_set_description';
export * from './operation_set_title';

export type TelegramV11ChatNode =
  | TelegramV11ChatAdministratorsNode
  | TelegramV11ChatGetNode
  | TelegramV11ChatLeaveNode
  | TelegramV11ChatMemberNode
  | TelegramV11ChatSetDescriptionNode
  | TelegramV11ChatSetTitleNode
  ;