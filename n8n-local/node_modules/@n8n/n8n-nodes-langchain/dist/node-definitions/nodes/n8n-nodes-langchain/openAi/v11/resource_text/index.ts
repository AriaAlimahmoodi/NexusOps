/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV11TextClassifyNode } from './operation_classify';
import type { LcOpenAiV11TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV11TextNode =
  | LcOpenAiV11TextClassifyNode
  | LcOpenAiV11TextMessageNode
  ;