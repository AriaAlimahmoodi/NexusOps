import type { PushMessage } from '@n8n/api-types';
import { Logger, TypedEmitter } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import type { OnPushMessage } from '../push/types';
export interface AbstractPushEvents {
    message: OnPushMessage;
}
export declare abstract class AbstractPush<Connection> extends TypedEmitter<AbstractPushEvents> {
    protected readonly logger: Logger;
    protected readonly errorReporter: ErrorReporter;
    protected connections: Record<string, Connection>;
    protected userIdByPushRef: Record<string, string>;
    protected abstract close(connection: Connection): void;
    protected abstract sendToOneConnection(connection: Connection, data: string, isBinary: boolean): void;
    protected abstract ping(connection: Connection): void;
    constructor(logger: Logger, errorReporter: ErrorReporter);
    protected add(pushRef: string, userId: User['id'], connection: Connection): void;
    protected onMessageReceived(pushRef: string, msg: unknown): void;
    protected getConnection(pushRef: string): Connection | undefined;
    protected remove(pushRef?: string): void;
    private sendTo;
    private pingAll;
    sendToAll(pushMsg: PushMessage): void;
    sendToOne(pushMsg: PushMessage, pushRef: string, asBinary?: boolean): void;
    sendToUsers(pushMsg: PushMessage, userIds: Array<User['id']>, options?: {
        excludePushRef?: string;
    }): void;
    getDiagnosticCounts(): {
        connections: number;
    };
    closeAllConnections(): void;
    hasPushRef(pushRef: string): boolean;
}
