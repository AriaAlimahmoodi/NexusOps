/**
 * Demio - Report Resource
 * Re-exports all operation types for this resource.
 */

import type { DemioV1ReportGetNode } from './operation_get';

export * from './operation_get';

export type DemioV1ReportNode = DemioV1ReportGetNode;