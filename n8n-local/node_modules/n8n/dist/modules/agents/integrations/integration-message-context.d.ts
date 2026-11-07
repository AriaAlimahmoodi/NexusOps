import type { JSONObject, ToolContext } from '@n8n/agents';
import type { IntegrationMessageContext } from './integration-tool-types';
export declare function encodeIntegrationMessageContext(context: IntegrationMessageContext | null): JSONObject;
export declare function readIntegrationMessageContext(persistence: ToolContext['persistence']): IntegrationMessageContext | null | undefined;
export declare function replaceIntegrationMessageContext(persistence: NonNullable<ToolContext['persistence']>, context: IntegrationMessageContext): void;
export declare function inheritIntegrationMessageContext(context: IntegrationMessageContext, previous: IntegrationMessageContext | null): IntegrationMessageContext;
export declare function isIntegrationMessageContext(value: unknown): value is IntegrationMessageContext;
