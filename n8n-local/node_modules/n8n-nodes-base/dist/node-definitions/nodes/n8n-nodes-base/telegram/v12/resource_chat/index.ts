/**
 * Telegram - Chat Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV12ChatAdministratorsNode } from './operation_administrators';
import type { TelegramV12ChatGetNode } from './operation_get';
import type { TelegramV12ChatLeaveNode } from './operation_leave';
import type { TelegramV12ChatMemberNode } from './operation_member';
import type { TelegramV12ChatSetDescriptionNode } from './operation_set_description';
import type { TelegramV12ChatSetTitleNode } from './operation_set_title';

export * from './operation_administrators';
export * from './operation_get';
export * from './operation_leave';
export * from './operation_member';
export * from './operation_set_description';
export * from './operation_set_title';

export type TelegramV12ChatNode =
  | TelegramV12ChatAdministratorsNode
  | TelegramV12ChatGetNode
  | TelegramV12ChatLeaveNode
  | TelegramV12ChatMemberNode
  | TelegramV12ChatSetDescriptionNode
  | TelegramV12ChatSetTitleNode
  ;