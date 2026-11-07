/**
 * MailerLite - Subscriber Resource
 * Re-exports all operation types for this resource.
 */

import type { MailerLiteV2SubscriberCreateNode } from './operation_create';
import type { MailerLiteV2SubscriberGetNode } from './operation_get';
import type { MailerLiteV2SubscriberGetAllNode } from './operation_get_all';
import type { MailerLiteV2SubscriberUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MailerLiteV2SubscriberNode =
  | MailerLiteV2SubscriberCreateNode
  | MailerLiteV2SubscriberGetNode
  | MailerLiteV2SubscriberGetAllNode
  | MailerLiteV2SubscriberUpdateNode
  ;