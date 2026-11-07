/**
 * Mailchimp Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MailchimpV1CampaignNode } from './resource_campaign';
import type { MailchimpV1ListGroupNode } from './resource_list_group';
import type { MailchimpV1MemberNode } from './resource_member';
import type { MailchimpV1MemberTagNode } from './resource_member_tag';

export * from './resource_campaign';
export * from './resource_list_group';
export * from './resource_member';
export * from './resource_member_tag';

export type MailchimpV1Node =
  | MailchimpV1CampaignNode
  | MailchimpV1ListGroupNode
  | MailchimpV1MemberNode
  | MailchimpV1MemberTagNode
  ;