/**
 * Mautic - ContactSegment Resource
 * Re-exports all operation types for this resource.
 */

import type { MauticV1ContactSegmentAddNode } from './operation_add';
import type { MauticV1ContactSegmentRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type MauticV1ContactSegmentNode =
  | MauticV1ContactSegmentAddNode
  | MauticV1ContactSegmentRemoveNode
  ;