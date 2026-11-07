/**
 * Telegram Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { TelegramV12ChatNode } from './resource_chat';
import type { TelegramV12CallbackNode } from './resource_callback';
import type { TelegramV12FileNode } from './resource_file';
import type { TelegramV12MessageNode } from './resource_message';

export * from './resource_chat';
export * from './resource_callback';
export * from './resource_file';
export * from './resource_message';

export type TelegramV12Node =
  | TelegramV12ChatNode
  | TelegramV12CallbackNode
  | TelegramV12FileNode
  | TelegramV12MessageNode
  ;