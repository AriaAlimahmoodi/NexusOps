/**
 * MiniMax - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcMinimaxV1TextMessageNode } from './operation_message';

export * from './operation_message';

export type LcMinimaxV1TextNode = LcMinimaxV1TextMessageNode;