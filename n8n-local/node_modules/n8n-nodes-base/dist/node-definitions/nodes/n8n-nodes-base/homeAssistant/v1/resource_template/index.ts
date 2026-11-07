/**
 * Home Assistant - Template Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1TemplateCreateNode } from './operation_create';

export * from './operation_create';

export type HomeAssistantV1TemplateNode = HomeAssistantV1TemplateCreateNode;