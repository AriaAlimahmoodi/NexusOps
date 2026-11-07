/**
 * Qwen Cloud - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcAlibabaCloudV11ImageAnalyzeNode } from './operation_analyze';
import type { LcAlibabaCloudV11ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcAlibabaCloudV11ImageNode =
  | LcAlibabaCloudV11ImageAnalyzeNode
  | LcAlibabaCloudV11ImageGenerateNode
  ;