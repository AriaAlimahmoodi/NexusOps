/**
 * Telegram Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { TelegramV11ChatNode } from './resource_chat';
import type { TelegramV11CallbackNode } from './resource_callback';
import type { TelegramV11FileNode } from './resource_file';
import type { TelegramV11MessageNode } from './resource_message';

export * from './resource_chat';
export * from './resource_callback';
export * from './resource_file';
export * from './resource_message';

export type TelegramV11Node =
  | TelegramV11ChatNode
  | TelegramV11CallbackNode
  | TelegramV11FileNode
  | TelegramV11MessageNode
  ;