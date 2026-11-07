/**
 * Jina AI - Research Resource
 * Re-exports all operation types for this resource.
 */

import type { JinaAiV1ResearchDeepResearchNode } from './operation_deep_research';

export * from './operation_deep_research';

export type JinaAiV1ResearchNode = JinaAiV1ResearchDeepResearchNode;