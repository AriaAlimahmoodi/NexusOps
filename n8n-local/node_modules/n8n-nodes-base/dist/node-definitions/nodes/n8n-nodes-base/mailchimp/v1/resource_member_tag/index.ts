/**
 * Mailchimp - MemberTag Resource
 * Re-exports all operation types for this resource.
 */

import type { MailchimpV1MemberTagCreateNode } from './operation_create';
import type { MailchimpV1MemberTagDeleteNode } from './operation_delete';

export * from './operation_create';
export * from './operation_delete';

export type MailchimpV1MemberTagNode =
  | MailchimpV1MemberTagCreateNode
  | MailchimpV1MemberTagDeleteNode
  ;