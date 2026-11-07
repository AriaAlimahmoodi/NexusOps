/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV16TextClassifyNode } from './operation_classify';
import type { LcOpenAiV16TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV16TextNode =
  | LcOpenAiV16TextClassifyNode
  | LcOpenAiV16TextMessageNode
  ;