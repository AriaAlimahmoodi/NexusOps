/**
 * Telegram - File Resource
 * Re-exports all operation types for this resource.
 */

import type { TelegramV1FileGetNode } from './operation_get';

export * from './operation_get';

export type TelegramV1FileNode = TelegramV1FileGetNode;