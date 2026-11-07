export interface WebhookRecord {
    type: 'webhook';
    timestamp: number;
    platform: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
}
export interface ApiCallRecord {
    type: 'api-call';
    timestamp: number;
    platform: string;
    method: string;
    args: unknown[];
    response?: unknown;
    error?: string;
}
export interface FetchRecord {
    type: 'fetch';
    timestamp: number;
    method: string;
    url: string;
    durationMs: number;
    requestHeaders?: Record<string, string>;
    requestBody?: string;
    responseHeaders?: Record<string, string>;
    responseBody?: string;
    status?: number;
    error?: string;
}
export type ChannelIntegrationRecord = WebhookRecord | ApiCallRecord | FetchRecord;
export declare class ChannelIntegrationRecorder {
    private readonly enabled;
    private readonly sessionId;
    private readonly recordingDir;
    private originalFetch;
    private fetchUrlPatterns;
    private readonly pendingRecords;
    constructor(options?: {
        enabled?: boolean;
        sessionId?: string;
        recordingDir?: string;
    });
    get isEnabled(): boolean;
    get currentSessionId(): string;
    get currentSessionPath(): string;
    recordWebhook(platform: string, request: Request): Promise<void>;
    recordApiCall(platform: string, method: string, args: unknown[], response?: unknown, error?: Error): Promise<void>;
    startFetchRecording(urlPatterns?: RegExp[]): void;
    stopFetchRecording(): void;
    listSessions(): Promise<Array<{
        sessionId: string;
        entries: number;
    }>>;
    getRecords(sessionId?: string): Promise<ChannelIntegrationRecord[]>;
    exportRecords(sessionId?: string): Promise<string>;
    deleteSession(sessionId?: string): Promise<void>;
    flush(): Promise<void>;
    private appendRecord;
    private recordBestEffort;
    private trackPendingRecord;
}
export declare const channelIntegrationRecorder: ChannelIntegrationRecorder;
