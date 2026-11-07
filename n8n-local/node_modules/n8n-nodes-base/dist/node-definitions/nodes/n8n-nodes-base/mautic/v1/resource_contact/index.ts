/**
 * Mautic - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { MauticV1ContactCreateNode } from './operation_create';
import type { MauticV1ContactDeleteNode } from './operation_delete';
import type { MauticV1ContactEditContactPointNode } from './operation_edit_contact_point';
import type { MauticV1ContactEditDoNotContactListNode } from './operation_edit_do_not_contact_list';
import type { MauticV1ContactGetNode } from './operation_get';
import type { MauticV1ContactGetAllNode } from './operation_get_all';
import type { MauticV1ContactSendEmailNode } from './operation_send_email';
import type { MauticV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_edit_contact_point';
export * from './operation_edit_do_not_contact_list';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_send_email';
export * from './operation_update';

export type MauticV1ContactNode =
  | MauticV1ContactCreateNode
  | MauticV1ContactDeleteNode
  | MauticV1ContactEditContactPointNode
  | MauticV1ContactEditDoNotContactListNode
  | MauticV1ContactGetNode
  | MauticV1ContactGetAllNode
  | MauticV1ContactSendEmailNode
  | MauticV1ContactUpdateNode
  ;