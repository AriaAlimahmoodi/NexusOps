/**
 * ConvertKit Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ConvertKitV1CustomFieldNode } from './resource_custom_field';
import type { ConvertKitV1FormNode } from './resource_form';
import type { ConvertKitV1SequenceNode } from './resource_sequence';
import type { ConvertKitV1TagNode } from './resource_tag';
import type { ConvertKitV1TagSubscriberNode } from './resource_tag_subscriber';

export * from './resource_custom_field';
export * from './resource_form';
export * from './resource_sequence';
export * from './resource_tag';
export * from './resource_tag_subscriber';

export type ConvertKitV1Node =
  | ConvertKitV1CustomFieldNode
  | ConvertKitV1FormNode
  | ConvertKitV1SequenceNode
  | ConvertKitV1TagNode
  | ConvertKitV1TagSubscriberNode
  ;