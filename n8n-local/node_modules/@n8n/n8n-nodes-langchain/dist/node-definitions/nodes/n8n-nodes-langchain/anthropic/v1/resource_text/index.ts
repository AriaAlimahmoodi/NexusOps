/**
 * Anthropic - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcAnthropicV1TextMessageNode } from './operation_message';

export * from './operation_message';

export type LcAnthropicV1TextNode = LcAnthropicV1TextMessageNode;