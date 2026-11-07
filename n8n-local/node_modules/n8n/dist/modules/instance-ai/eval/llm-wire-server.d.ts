import type { Logger } from '@n8n/backend-common';
import type { EvalLlmMockHandler } from 'n8n-core';
import type { INode } from 'n8n-workflow';
export interface InterceptedTurn {
    rootName: string;
    url: string;
    method: string;
    nodeType: string;
    requestBody: unknown;
    mockResponse: unknown;
}
export interface LlmWireServerOptions {
    mockHandler?: EvalLlmMockHandler;
    rootToSubNode?: ReadonlyMap<string, INode>;
    onIntercept?: (turn: InterceptedTurn) => void;
    logger: Logger;
}
export declare class LlmWireServer {
    private readonly options;
    private server;
    private resolvedUrl;
    private readonly inFlight;
    private stopping;
    constructor(options: LlmWireServerOptions);
    get url(): string;
    start(): Promise<string>;
    stop(): Promise<void>;
    private buildApp;
    private routeFor;
    private handleProtocol;
    private writeSseResponse;
    private respondWithStub;
    private respondWithError;
    private handleUnrouted;
    private resolveSubNode;
}
