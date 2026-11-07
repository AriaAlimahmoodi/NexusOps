/**
 * Lemlist - Enrich Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV2EnrichEnrichLeadNode } from './operation_enrich_lead';
import type { LemlistV2EnrichEnrichPersonNode } from './operation_enrich_person';
import type { LemlistV2EnrichGetNode } from './operation_get';

export * from './operation_enrich_lead';
export * from './operation_enrich_person';
export * from './operation_get';

export type LemlistV2EnrichNode =
  | LemlistV2EnrichEnrichLeadNode
  | LemlistV2EnrichEnrichPersonNode
  | LemlistV2EnrichGetNode
  ;