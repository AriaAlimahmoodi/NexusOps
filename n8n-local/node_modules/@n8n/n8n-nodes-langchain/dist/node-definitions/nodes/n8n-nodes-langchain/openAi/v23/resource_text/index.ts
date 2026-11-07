/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV23TextClassifyNode } from './operation_classify';
import type { LcOpenAiV23TextResponseNode } from './operation_response';

export * from './operation_classify';
export * from './operation_response';

export type LcOpenAiV23TextNode =
  | LcOpenAiV23TextClassifyNode
  | LcOpenAiV23TextResponseNode
  ;