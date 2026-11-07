/**
 * Perplexity - Embedding Resource
 * Re-exports all operation types for this resource.
 */

import type { PerplexityV1EmbeddingCreateContextualizedNode } from './operation_create_contextualized';
import type { PerplexityV1EmbeddingCreateEmbeddingNode } from './operation_create_embedding';

export * from './operation_create_contextualized';
export * from './operation_create_embedding';

export type PerplexityV1EmbeddingNode =
  | PerplexityV1EmbeddingCreateContextualizedNode
  | PerplexityV1EmbeddingCreateEmbeddingNode
  ;