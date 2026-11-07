/**
 * OpenAI - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV18TextClassifyNode } from './operation_classify';
import type { LcOpenAiV18TextMessageNode } from './operation_message';

export * from './operation_classify';
export * from './operation_message';

export type LcOpenAiV18TextNode =
  | LcOpenAiV18TextClassifyNode
  | LcOpenAiV18TextMessageNode
  ;