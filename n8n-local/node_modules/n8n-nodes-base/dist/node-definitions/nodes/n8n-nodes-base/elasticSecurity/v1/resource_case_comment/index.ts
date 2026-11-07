/**
 * Elastic Security - CaseComment Resource
 * Re-exports all operation types for this resource.
 */

import type { ElasticSecurityV1CaseCommentAddNode } from './operation_add';
import type { ElasticSecurityV1CaseCommentGetNode } from './operation_get';
import type { ElasticSecurityV1CaseCommentGetAllNode } from './operation_get_all';
import type { ElasticSecurityV1CaseCommentRemoveNode } from './operation_remove';
import type { ElasticSecurityV1CaseCommentUpdateNode } from './operation_update';

export * from './operation_add';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove';
export * from './operation_update';

export type ElasticSecurityV1CaseCommentNode =
  | ElasticSecurityV1CaseCommentAddNode
  | ElasticSecurityV1CaseCommentGetNode
  | ElasticSecurityV1CaseCommentGetAllNode
  | ElasticSecurityV1CaseCommentRemoveNode
  | ElasticSecurityV1CaseCommentUpdateNode
  ;