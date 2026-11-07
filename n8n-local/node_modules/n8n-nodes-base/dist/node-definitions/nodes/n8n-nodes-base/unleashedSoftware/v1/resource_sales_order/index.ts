/**
 * Unleashed Software - SalesOrder Resource
 * Re-exports all operation types for this resource.
 */

import type { UnleashedSoftwareV1SalesOrderGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type UnleashedSoftwareV1SalesOrderNode = UnleashedSoftwareV1SalesOrderGetAllNode;