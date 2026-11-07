import type { Telemetry } from '../../../telemetry';
import type { UserCalledMCPToolEventPayload } from '../mcp.types';
export declare function trackAndReturnToolError(telemetry: Telemetry, telemetryPayload: UserCalledMCPToolEventPayload, error: unknown, formatOutput?: (message: string) => Record<string, unknown>): {
    content: {
        type: 'text';
        text: string;
    }[];
    structuredContent: Record<string, unknown>;
    isError: boolean;
};
export declare function trackAndRethrowToolError(telemetry: Telemetry, telemetryPayload: UserCalledMCPToolEventPayload, error: unknown): never;
