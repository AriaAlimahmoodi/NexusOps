/**
 * Crypto Node Types
 *
 * Re-exports all version-specific types and provides combined union type.
 */

import type { CryptoV2Node } from './v2';
import type { CryptoV1Node } from './v1';

export * from './v2';
export * from './v1';

// Combined union type for all versions
export type CryptoNode = CryptoV2Node | CryptoV1Node;