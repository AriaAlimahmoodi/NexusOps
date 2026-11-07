/**
 * Lemlist - Activity Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV1ActivityGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type LemlistV1ActivityNode = LemlistV1ActivityGetAllNode;