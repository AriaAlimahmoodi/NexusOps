/**
 * WhatsApp Business Cloud - Media Resource
 * Re-exports all operation types for this resource.
 */

import type { WhatsAppV1MediaMediaDeleteNode } from './operation_media_delete';
import type { WhatsAppV1MediaMediaUploadNode } from './operation_media_upload';
import type { WhatsAppV1MediaMediaUrlGetNode } from './operation_media_url_get';

export * from './operation_media_delete';
export * from './operation_media_upload';
export * from './operation_media_url_get';

export type WhatsAppV1MediaNode =
  | WhatsAppV1MediaMediaDeleteNode
  | WhatsAppV1MediaMediaUploadNode
  | WhatsAppV1MediaMediaUrlGetNode
  ;