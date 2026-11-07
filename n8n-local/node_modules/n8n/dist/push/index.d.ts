import type { PushMessage } from '@n8n/api-types';
import { Logger, TypedEmitter } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import type { Application } from 'express';
import type { Server } from 'http';
import { InstanceSettings } from 'n8n-core';
import { AuthService } from '../auth/auth.service';
import { Publisher } from '../scaling/pubsub/publisher.service';
import { PushConfig } from './push.config';
import { SSEPush } from './sse.push';
import { type OnPushMessage, type PushResponse, type SSEPushRequest, type WebSocketPushRequest } from './types';
import { WebSocketPush } from './websocket.push';
type PushEvents = {
    editorUiConnected: string;
    message: OnPushMessage;
};
export declare class Push extends TypedEmitter<PushEvents> {
    private readonly config;
    private readonly instanceSettings;
    private readonly logger;
    private readonly authService;
    private readonly publisher;
    private useWebSockets;
    isBidirectional: boolean;
    private backend;
    constructor(config: PushConfig, instanceSettings: InstanceSettings, logger: Logger, authService: AuthService, publisher: Publisher);
    getBackend(): SSEPush | WebSocketPush;
    setupPushServer(restEndpoint: string, server: Server, app: Application): void;
    setupPushHandler(restEndpoint: string, app: Application): void;
    handleRequest(req: SSEPushRequest | WebSocketPushRequest, res: PushResponse): void;
    broadcast(pushMsg: PushMessage): void;
    hasPushRef(pushRef: string): boolean;
    send(pushMsg: PushMessage, pushRef: string, asBinary?: boolean): void;
    sendToUsers(pushMsg: PushMessage, userIds: Array<User['id']>, options?: {
        excludePushRef?: string;
    }): void;
    onShutdown(): void;
    private shouldRelayViaPubSub;
    handleRelayExecutionLifecycleEvent({ pushRef, asBinary, ...pushMsg }: PushMessage & {
        asBinary: boolean;
        pushRef: string;
    }): void;
    private relayViaPubSub;
}
export {};
