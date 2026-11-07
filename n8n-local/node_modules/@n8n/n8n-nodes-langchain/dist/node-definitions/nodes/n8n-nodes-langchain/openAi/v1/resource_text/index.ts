/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV1TextClassifyNode } from './operation_classify';
import type { LcOpenAiV1TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV1TextNode =
  | LcOpenAiV1TextClassifyNode
  | LcOpenAiV1TextMessageNode
  ;