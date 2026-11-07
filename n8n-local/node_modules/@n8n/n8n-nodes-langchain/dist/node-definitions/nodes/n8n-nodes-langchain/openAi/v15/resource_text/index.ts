/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV15TextClassifyNode } from './operation_classify';
import type { LcOpenAiV15TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV15TextNode =
  | LcOpenAiV15TextClassifyNode
  | LcOpenAiV15TextMessageNode
  ;