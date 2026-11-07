/**
 * Telegram - Callback Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV12CallbackAnswerInlineQueryNode } from './operation_answer_inline_query';
import type { TelegramV12CallbackAnswerQueryNode } from './operation_answer_query';

export * from './operation_answer_inline_query';
export * from './operation_answer_query';

export type TelegramV12CallbackNode =
  | TelegramV12CallbackAnswerInlineQueryNode
  | TelegramV12CallbackAnswerQueryNode
  ;