/**
 * Matrix - Media Resource
 * Re-exports all operation types for this resource.
 */

import type { MatrixV1MediaUploadNode } from './operation_upload';

export * from './operation_upload';

export type MatrixV1MediaNode = MatrixV1MediaUploadNode;