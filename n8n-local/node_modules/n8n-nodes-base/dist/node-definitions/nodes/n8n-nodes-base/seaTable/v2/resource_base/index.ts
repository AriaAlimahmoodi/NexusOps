/**
 * SeaTable - Base Resource
 * Re-exports all operation types for this resource.
 */

import type { SeaTableV2BaseCollaboratorNode } from './operation_collaborator';
import type { SeaTableV2BaseMetadataNode } from './operation_metadata';
import type { SeaTableV2BaseSnapshotNode } from './operation_snapshot';

export * from './operation_collaborator';
export * from './operation_metadata';
export * from './operation_snapshot';

export type SeaTableV2BaseNode =
  | SeaTableV2BaseCollaboratorNode
  | SeaTableV2BaseMetadataNode
  | SeaTableV2BaseSnapshotNode
  ;