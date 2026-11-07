/**
 * Jina AI - Reader Resource
 * Re-exports all operation types for this resource.
 */

import type { JinaAiV1ReaderReadNode } from './operation_read';
import type { JinaAiV1ReaderSearchNode } from './operation_search';

export * from './operation_read';
export * from './operation_search';

export type JinaAiV1ReaderNode =
  | JinaAiV1ReaderReadNode
  | JinaAiV1ReaderSearchNode
  ;