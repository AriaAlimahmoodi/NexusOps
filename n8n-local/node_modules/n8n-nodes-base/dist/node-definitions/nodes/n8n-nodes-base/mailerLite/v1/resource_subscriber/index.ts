/**
 * MailerLite - Subscriber Resource
 * Re-exports all operation types for this resource.
 */

import type { MailerLiteV1SubscriberCreateNode } from './operation_create';
import type { MailerLiteV1SubscriberGetNode } from './operation_get';
import type { MailerLiteV1SubscriberGetAllNode } from './operation_get_all';
import type { MailerLiteV1SubscriberUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MailerLiteV1SubscriberNode =
  | MailerLiteV1SubscriberCreateNode
  | MailerLiteV1SubscriberGetNode
  | MailerLiteV1SubscriberGetAllNode
  | MailerLiteV1SubscriberUpdateNode
  ;