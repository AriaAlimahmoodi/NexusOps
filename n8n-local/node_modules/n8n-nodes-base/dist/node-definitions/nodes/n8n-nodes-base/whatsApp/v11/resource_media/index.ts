/**
 * WhatsApp Business Cloud - Media Resource
 * Re-exports all operation types for this resource.
 */

import type { WhatsAppV11MediaMediaDeleteNode } from './operation_media_delete';
import type { WhatsAppV11MediaMediaUploadNode } from './operation_media_upload';
import type { WhatsAppV11MediaMediaUrlGetNode } from './operation_media_url_get';

export * from './operation_media_delete';
export * from './operation_media_upload';
export * from './operation_media_url_get';

export type WhatsAppV11MediaNode =
  | WhatsAppV11MediaMediaDeleteNode
  | WhatsAppV11MediaMediaUploadNode
  | WhatsAppV11MediaMediaUrlGetNode
  ;