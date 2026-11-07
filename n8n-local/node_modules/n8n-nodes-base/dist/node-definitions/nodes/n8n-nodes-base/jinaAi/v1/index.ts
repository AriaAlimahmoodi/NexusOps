/**
 * Jina AI Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { JinaAiV1ReaderNode } from './resource_reader';
import type { JinaAiV1ResearchNode } from './resource_research';

export * from './resource_reader';
export * from './resource_research';

export type JinaAiV1Node =
  | JinaAiV1ReaderNode
  | JinaAiV1ResearchNode
  ;