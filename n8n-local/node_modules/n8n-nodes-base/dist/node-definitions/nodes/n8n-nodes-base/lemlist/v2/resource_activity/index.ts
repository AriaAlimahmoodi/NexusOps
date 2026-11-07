/**
 * Lemlist - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV2ActivityGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type LemlistV2ActivityNode = LemlistV2ActivityGetAllNode;