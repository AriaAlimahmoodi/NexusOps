/**
 * Elastic Security Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ElasticSecurityV1CaseNode } from './resource_case';
import type { ElasticSecurityV1CaseCommentNode } from './resource_case_comment';
import type { ElasticSecurityV1CaseTagNode } from './resource_case_tag';
import type { ElasticSecurityV1ConnectorNode } from './resource_connector';

export * from './resource_case';
export * from './resource_case_comment';
export * from './resource_case_tag';
export * from './resource_connector';

export type ElasticSecurityV1Node =
  | ElasticSecurityV1CaseNode
  | ElasticSecurityV1CaseCommentNode
  | ElasticSecurityV1CaseTagNode
  | ElasticSecurityV1ConnectorNode
  ;