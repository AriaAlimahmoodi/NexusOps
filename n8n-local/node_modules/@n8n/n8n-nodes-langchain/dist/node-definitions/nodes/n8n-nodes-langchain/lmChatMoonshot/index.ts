/**
 * Moonshot Kimi Chat Model Node Types
 *
 * Re-exports all version-specific types and provides combined union type.
 */

import type { LcLmChatMoonshotV11Node } from './v11';
import type { LcLmChatMoonshotV1Node } from './v1';

export * from './v11';
export * from './v1';

// Combined union type for all versions
export type LcLmChatMoonshotNode = LcLmChatMoonshotV11Node | LcLmChatMoonshotV1Node;