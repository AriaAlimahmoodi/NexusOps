/**
 * Home Assistant - CameraProxy Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1CameraProxyGetScreenshotNode } from './operation_get_screenshot';

export * from './operation_get_screenshot';

export type HomeAssistantV1CameraProxyNode = HomeAssistantV1CameraProxyGetScreenshotNode;