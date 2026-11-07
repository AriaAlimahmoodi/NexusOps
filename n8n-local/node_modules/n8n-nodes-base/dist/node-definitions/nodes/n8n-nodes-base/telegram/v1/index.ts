/**
 * Telegram Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TelegramV1ChatNode } from './resource_chat';
import type { TelegramV1CallbackNode } from './resource_callback';
import type { TelegramV1FileNode } from './resource_file';
import type { TelegramV1MessageNode } from './resource_message';

export * from './resource_chat';
export * from './resource_callback';
export * from './resource_file';
export * from './resource_message';

export type TelegramV1Node =
  | TelegramV1ChatNode
  | TelegramV1CallbackNode
  | TelegramV1FileNode
  | TelegramV1MessageNode
  ;