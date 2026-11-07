/**
 * Salesforce - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1DocumentUploadNode } from './operation_upload';

export * from './operation_upload';

export type SalesforceV1DocumentNode = SalesforceV1DocumentUploadNode;