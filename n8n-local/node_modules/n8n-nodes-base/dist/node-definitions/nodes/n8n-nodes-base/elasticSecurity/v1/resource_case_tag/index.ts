/**
 * Elastic Security - CaseTag Resource
 * Re-exports all operation types for this resource.
 */

import type { ElasticSecurityV1CaseTagAddNode } from './operation_add';
import type { ElasticSecurityV1CaseTagRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type ElasticSecurityV1CaseTagNode =
  | ElasticSecurityV1CaseTagAddNode
  | ElasticSecurityV1CaseTagRemoveNode
  ;