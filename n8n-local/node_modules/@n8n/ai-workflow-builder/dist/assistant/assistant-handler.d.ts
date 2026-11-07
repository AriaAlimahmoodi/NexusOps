import type { Logger } from '@n8n/backend-common';
import type { AssistantContext, AssistantResult, AssistantSdkClient, StreamWriter } from './types';
export declare class AssistantHandler {
    private readonly client;
    private readonly logger?;
    constructor(client: AssistantSdkClient, logger?: Logger | undefined);
    execute(context: AssistantContext, userId: string, writer: StreamWriter, abortSignal?: AbortSignal): Promise<AssistantResult>;
    buildSdkPayload(context: AssistantContext): {
        payload: object;
        sessionId?: string;
    };
    private callSdk;
    private consumeSdkStream;
    private processChunkMessages;
    private mapSdkMessage;
    private isSdkText;
    private isSdkCodeDiff;
    private isSdkSummary;
    private isSdkAgentSuggestion;
    private isSdkIntermediateStep;
    private isSdkEvent;
    private isSdkError;
}
