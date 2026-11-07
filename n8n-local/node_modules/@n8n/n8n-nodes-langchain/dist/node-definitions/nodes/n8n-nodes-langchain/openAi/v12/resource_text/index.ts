/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV12TextClassifyNode } from './operation_classify';
import type { LcOpenAiV12TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV12TextNode =
  | LcOpenAiV12TextClassifyNode
  | LcOpenAiV12TextMessageNode
  ;