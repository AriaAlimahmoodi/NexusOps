/**
 * Telegram - Callback Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV11CallbackAnswerInlineQueryNode } from './operation_answer_inline_query';
import type { TelegramV11CallbackAnswerQueryNode } from './operation_answer_query';

export * from './operation_answer_inline_query';
export * from './operation_answer_query';

export type TelegramV11CallbackNode =
  | TelegramV11CallbackAnswerInlineQueryNode
  | TelegramV11CallbackAnswerQueryNode
  ;