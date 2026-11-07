/**
 * Perplexity - Embedding Resource
 * Re-exports all operation types for this resource.
 */

import type { PerplexityV2EmbeddingCreateContextualizedNode } from './operation_create_contextualized';
import type { PerplexityV2EmbeddingCreateEmbeddingNode } from './operation_create_embedding';

export * from './operation_create_contextualized';
export * from './operation_create_embedding';

export type PerplexityV2EmbeddingNode =
  | PerplexityV2EmbeddingCreateContextualizedNode
  | PerplexityV2EmbeddingCreateEmbeddingNode
  ;