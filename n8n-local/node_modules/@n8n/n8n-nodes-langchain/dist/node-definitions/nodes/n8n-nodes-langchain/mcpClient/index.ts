/**
 * MCP Client Node Types
 *
 * Re-exports all version-specific types and provides combined union type.
 */

import type { LcMcpClientV11Node } from './v11';
import type { LcMcpClientV1Node } from './v1';

export * from './v11';
export * from './v1';

// Combined union type for all versions
export type LcMcpClientNode = LcMcpClientV11Node | LcMcpClientV1Node;