/**
 * Telegram - File Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV12FileGetNode } from './operation_get';

export * from './operation_get';

export type TelegramV12FileNode = TelegramV12FileGetNode;