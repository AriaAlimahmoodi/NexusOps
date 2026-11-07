/**
 * Google Business Profile - Review Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleBusinessProfileV1ReviewDeleteNode } from './operation_delete';
import type { GoogleBusinessProfileV1ReviewGetNode } from './operation_get';
import type { GoogleBusinessProfileV1ReviewGetAllNode } from './operation_get_all';
import type { GoogleBusinessProfileV1ReviewReplyNode } from './operation_reply';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_reply';

export type GoogleBusinessProfileV1ReviewNode =
  | GoogleBusinessProfileV1ReviewDeleteNode
  | GoogleBusinessProfileV1ReviewGetNode
  | GoogleBusinessProfileV1ReviewGetAllNode
  | GoogleBusinessProfileV1ReviewReplyNode
  ;