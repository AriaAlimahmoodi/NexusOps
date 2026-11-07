import type { InstanceAiGatewayCapabilities, McpToolCallResult, ToolCategory } from '@n8n/api-types';
import { LocalGateway } from './local-gateway';
export declare class LocalGatewayRegistry {
    private readonly userGateways;
    private readonly apiKeyToUserId;
    private generateUniqueKey;
    private getOrCreate;
    getUserIdForApiKey(key: string): string | undefined;
    generatePairingToken(userId: string): string;
    getPairingToken(userId: string): string | null;
    getApiKeyExpiresAt(userId: string, key: string): Date | null;
    consumePairingToken(userId: string, token: string): string | null;
    getActiveSessionKey(userId: string): string | null;
    clearActiveSessionKey(userId: string): void;
    getGateway(userId: string): LocalGateway;
    findGateway(userId: string): LocalGateway | undefined;
    initGateway(userId: string, data: InstanceAiGatewayCapabilities): void;
    resolveGatewayRequest(userId: string, requestId: string, result?: McpToolCallResult, error?: string): boolean;
    disconnectGateway(userId: string): void;
    getGatewayStatus(userId: string): {
        connected: boolean;
        connectedAt: string | null;
        directory: string | null;
        hostIdentifier: string | null;
        toolCategories: ToolCategory[];
    };
    startDisconnectTimer(userId: string, onDisconnect: () => void): void;
    clearDisconnectTimer(userId: string): void;
    getConnectedUserIds(): string[];
    disconnectAll(): void;
}
