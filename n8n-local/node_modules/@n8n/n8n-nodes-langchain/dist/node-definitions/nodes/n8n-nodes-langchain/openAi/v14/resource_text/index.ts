/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV14TextClassifyNode } from './operation_classify';
import type { LcOpenAiV14TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV14TextNode =
  | LcOpenAiV14TextClassifyNode
  | LcOpenAiV14TextMessageNode
  ;