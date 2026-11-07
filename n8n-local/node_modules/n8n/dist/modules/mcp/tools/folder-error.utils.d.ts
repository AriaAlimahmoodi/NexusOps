import type { Telemetry } from '../../../telemetry';
import type { UserCalledMCPToolEventPayload } from '../mcp.types';
export declare function describeFolderError(error: unknown): string;
export declare const createFailHandler: (telemetry: Telemetry, telemetryPayload: UserCalledMCPToolEventPayload) => (error: string) => {
    content: {
        type: 'text';
        text: string;
    }[];
    structuredContent: {
        error: string;
    };
    isError: boolean;
};
