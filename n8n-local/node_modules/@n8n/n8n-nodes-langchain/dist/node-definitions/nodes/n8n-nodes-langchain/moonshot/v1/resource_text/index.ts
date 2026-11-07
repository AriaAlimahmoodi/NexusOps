/**
 * Moonshot Kimi - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcMoonshotV1TextMessageNode } from './operation_message';

export * from './operation_message';

export type LcMoonshotV1TextNode = LcMoonshotV1TextMessageNode;