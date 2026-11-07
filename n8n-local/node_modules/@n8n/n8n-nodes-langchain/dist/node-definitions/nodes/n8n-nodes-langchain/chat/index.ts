/**
 * Chat Node Types
 *
 * Re-exports all version-specific types and provides combined union type.
 */

import type { LcChatV13Node } from './v13';
import type { LcChatV12Node } from './v12';
import type { LcChatV11Node } from './v11';
import type { LcChatV1Node } from './v1';

export * from './v13';
export * from './v12';
export * from './v11';
export * from './v1';

// Combined union type for all versions
export type LcChatNode = LcChatV13Node | LcChatV12Node | LcChatV11Node | LcChatV1Node;