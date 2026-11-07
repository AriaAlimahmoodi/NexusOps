/**
 * Telegram - Callback Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV1CallbackAnswerInlineQueryNode } from './operation_answer_inline_query';
import type { TelegramV1CallbackAnswerQueryNode } from './operation_answer_query';

export * from './operation_answer_inline_query';
export * from './operation_answer_query';

export type TelegramV1CallbackNode =
  | TelegramV1CallbackAnswerInlineQueryNode
  | TelegramV1CallbackAnswerQueryNode
  ;