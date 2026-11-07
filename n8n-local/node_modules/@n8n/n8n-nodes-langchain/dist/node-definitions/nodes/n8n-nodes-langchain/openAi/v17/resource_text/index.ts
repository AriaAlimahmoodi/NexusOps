/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV17TextClassifyNode } from './operation_classify';
import type { LcOpenAiV17TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV17TextNode =
  | LcOpenAiV17TextClassifyNode
  | LcOpenAiV17TextMessageNode
  ;