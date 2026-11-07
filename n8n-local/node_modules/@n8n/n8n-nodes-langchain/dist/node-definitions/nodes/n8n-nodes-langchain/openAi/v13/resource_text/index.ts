/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV13TextClassifyNode } from './operation_classify';
import type { LcOpenAiV13TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV13TextNode =
  | LcOpenAiV13TextClassifyNode
  | LcOpenAiV13TextMessageNode
  ;