/**
 * Home Assistant Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { HomeAssistantV1CameraProxyNode } from './resource_camera_proxy';
import type { HomeAssistantV1ConfigNode } from './resource_config';
import type { HomeAssistantV1EventNode } from './resource_event';
import type { HomeAssistantV1LogNode } from './resource_log';
import type { HomeAssistantV1ServiceNode } from './resource_service';
import type { HomeAssistantV1StateNode } from './resource_state';
import type { HomeAssistantV1TemplateNode } from './resource_template';

export * from './resource_camera_proxy';
export * from './resource_config';
export * from './resource_event';
export * from './resource_log';
export * from './resource_service';
export * from './resource_state';
export * from './resource_template';

export type HomeAssistantV1Node =
  | HomeAssistantV1CameraProxyNode
  | HomeAssistantV1ConfigNode
  | HomeAssistantV1EventNode
  | HomeAssistantV1LogNode
  | HomeAssistantV1ServiceNode
  | HomeAssistantV1StateNode
  | HomeAssistantV1TemplateNode
  ;