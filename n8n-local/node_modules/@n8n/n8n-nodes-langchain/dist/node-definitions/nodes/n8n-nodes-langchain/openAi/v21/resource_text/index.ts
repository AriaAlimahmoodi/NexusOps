/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV21TextClassifyNode } from './operation_classify';
import type { LcOpenAiV21TextResponseNode } from './operation_response';

export * from './operation_classify';
export * from './operation_response';

export type LcOpenAiV21TextNode =
  | LcOpenAiV21TextClassifyNode
  | LcOpenAiV21TextResponseNode
  ;