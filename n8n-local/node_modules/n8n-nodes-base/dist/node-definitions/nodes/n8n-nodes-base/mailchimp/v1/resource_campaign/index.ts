/**
 * Mailchimp - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { MailchimpV1CampaignDeleteNode } from './operation_delete';
import type { MailchimpV1CampaignGetNode } from './operation_get';
import type { MailchimpV1CampaignGetAllNode } from './operation_get_all';
import type { MailchimpV1CampaignReplicateNode } from './operation_replicate';
import type { MailchimpV1CampaignResendNode } from './operation_resend';
import type { MailchimpV1CampaignSendNode } from './operation_send';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_replicate';
export * from './operation_resend';
export * from './operation_send';

export type MailchimpV1CampaignNode =
  | MailchimpV1CampaignDeleteNode
  | MailchimpV1CampaignGetNode
  | MailchimpV1CampaignGetAllNode
  | MailchimpV1CampaignReplicateNode
  | MailchimpV1CampaignResendNode
  | MailchimpV1CampaignSendNode
  ;