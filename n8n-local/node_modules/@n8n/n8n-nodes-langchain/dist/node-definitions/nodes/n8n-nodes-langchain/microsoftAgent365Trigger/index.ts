/**
 * Microsoft Agent 365 Trigger Node Types
 *
 * Re-exports all version-specific types and provides combined union type.
 */

import type { LcMicrosoftAgent365TriggerV11Node } from './v11';
import type { LcMicrosoftAgent365TriggerV1Node } from './v1';

export * from './v11';
export * from './v1';

// Combined union type for all versions
export type LcMicrosoftAgent365TriggerNode = LcMicrosoftAgent365TriggerV11Node | LcMicrosoftAgent365TriggerV1Node;