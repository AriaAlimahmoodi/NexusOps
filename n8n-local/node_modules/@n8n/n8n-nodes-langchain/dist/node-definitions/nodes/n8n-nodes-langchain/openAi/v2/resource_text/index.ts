/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV2TextClassifyNode } from './operation_classify';
import type { LcOpenAiV2TextResponseNode } from './operation_response';

export * from './operation_classify';
export * from './operation_response';

export type LcOpenAiV2TextNode =
  | LcOpenAiV2TextClassifyNode
  | LcOpenAiV2TextResponseNode
  ;