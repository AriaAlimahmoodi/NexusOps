/**
 * HubSpot - Form Resource
 * Re-exports all operation types for this resource.
 */

import type { HubspotV1FormGetFieldsNode } from './operation_get_fields';
import type { HubspotV1FormSubmitNode } from './operation_submit';

export * from './operation_get_fields';
export * from './operation_submit';

export type HubspotV1FormNode =
  | HubspotV1FormGetFieldsNode
  | HubspotV1FormSubmitNode
  ;