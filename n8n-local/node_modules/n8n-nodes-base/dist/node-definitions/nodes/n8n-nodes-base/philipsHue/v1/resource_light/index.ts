/**
 * Philips Hue - Light Resource
 * Re-exports all operation types for this resource.
 */

import type { PhilipsHueV1LightDeleteNode } from './operation_delete';
import type { PhilipsHueV1LightGetNode } from './operation_get';
import type { PhilipsHueV1LightGetAllNode } from './operation_get_all';
import type { PhilipsHueV1LightUpdateNode } from './operation_update';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type PhilipsHueV1LightNode =
  | PhilipsHueV1LightDeleteNode
  | PhilipsHueV1LightGetNode
  | PhilipsHueV1LightGetAllNode
  | PhilipsHueV1LightUpdateNode
  ;