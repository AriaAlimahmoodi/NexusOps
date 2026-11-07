/**
 * Google BigQuery - Record Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBigQueryV1RecordCreateNode } from './operation_create';
import type { GoogleBigQueryV1RecordGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type GoogleBigQueryV1RecordNode =
  | GoogleBigQueryV1RecordCreateNode
  | GoogleBigQueryV1RecordGetAllNode
  ;