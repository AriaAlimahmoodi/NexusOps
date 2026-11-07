/**
 * Mistral AI - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { MistralAiV1DocumentExtractTextNode } from './operation_extract_text';

export * from './operation_extract_text';

export type MistralAiV1DocumentNode = MistralAiV1DocumentExtractTextNode;