import type { InstanceAiGatewayCapabilities, McpToolCallResult, ToolCategory } from '@n8n/api-types';
import { Telemetry } from '../../telemetry';
import { type LocalGateway } from './filesystem';
import { InstanceAiSettingsService } from './instance-ai-settings.service';
export declare const BROWSER_TOOL_CATEGORY = "browser";
export declare class InstanceAiGatewayService {
    private readonly telemetry;
    private readonly settingsService;
    private readonly registry;
    constructor(telemetry: Telemetry, settingsService: InstanceAiSettingsService);
    applyToolPolicy(userId: string): void;
    getUserIdForApiKey(key: string): string | undefined;
    generatePairingToken(userId: string): string;
    getGatewayApiKeyExpiresAt(userId: string, key: string): Date | null;
    getPairingToken(userId: string): string | null;
    consumePairingToken(userId: string, token: string): string | null;
    getActiveSessionKey(userId: string): string | null;
    clearActiveSessionKey(userId: string): void;
    getLocalGateway(userId: string): LocalGateway;
    findGateway(userId: string): LocalGateway | undefined;
    initGateway(userId: string, data: InstanceAiGatewayCapabilities): void;
    resolveGatewayRequest(userId: string, requestId: string, result?: McpToolCallResult, error?: string): boolean;
    disconnectGateway(userId: string): void;
    disconnectAllGateways(): string[];
    disconnectAll(): void;
    getGatewayStatus(userId: string): {
        connected: boolean;
        connectedAt: string | null;
        directory: string | null;
        hostIdentifier: string | null;
        toolCategories: ToolCategory[];
    };
    startDisconnectTimer(userId: string, onDisconnect: () => void): void;
    clearDisconnectTimer(userId: string): void;
}
