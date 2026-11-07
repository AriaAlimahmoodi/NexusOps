/**
 * Help Scout - Mailbox Resource
 * Re-exports all operation types for this resource.
 */

import type { HelpScoutV1MailboxGetNode } from './operation_get';
import type { HelpScoutV1MailboxGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type HelpScoutV1MailboxNode =
  | HelpScoutV1MailboxGetNode
  | HelpScoutV1MailboxGetAllNode
  ;