/**
 * Quick Base Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { QuickbaseV1FieldNode } from './resource_field';
import type { QuickbaseV1FileNode } from './resource_file';
import type { QuickbaseV1RecordNode } from './resource_record';
import type { QuickbaseV1ReportNode } from './resource_report';

export * from './resource_field';
export * from './resource_file';
export * from './resource_record';
export * from './resource_report';

export type QuickbaseV1Node =
  | QuickbaseV1FieldNode
  | QuickbaseV1FileNode
  | QuickbaseV1RecordNode
  | QuickbaseV1ReportNode
  ;