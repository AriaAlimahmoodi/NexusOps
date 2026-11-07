/**
 * Lemlist - Team Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV1TeamGetNode } from './operation_get';

export * from './operation_get';

export type LemlistV1TeamNode = LemlistV1TeamGetNode;