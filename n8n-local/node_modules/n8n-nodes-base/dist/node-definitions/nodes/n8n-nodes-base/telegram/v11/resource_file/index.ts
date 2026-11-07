/**
 * Telegram - File Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV11FileGetNode } from './operation_get';

export * from './operation_get';

export type TelegramV11FileNode = TelegramV11FileGetNode;