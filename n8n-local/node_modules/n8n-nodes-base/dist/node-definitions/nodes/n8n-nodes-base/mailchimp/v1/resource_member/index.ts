/**
 * Mailchimp - Member Resource
 * Re-exports all operation types for this resource.
 */

import type { MailchimpV1MemberCreateNode } from './operation_create';
import type { MailchimpV1MemberDeleteNode } from './operation_delete';
import type { MailchimpV1MemberGetNode } from './operation_get';
import type { MailchimpV1MemberGetAllNode } from './operation_get_all';
import type { MailchimpV1MemberUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MailchimpV1MemberNode =
  | MailchimpV1MemberCreateNode
  | MailchimpV1MemberDeleteNode
  | MailchimpV1MemberGetNode
  | MailchimpV1MemberGetAllNode
  | MailchimpV1MemberUpdateNode
  ;