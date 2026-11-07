import type { Tool } from '@langchain/core/tools';
import type { SessionStore } from './SessionStore';
export interface RedisPublisher {
    set(key: string, value: string, ttl: number): Promise<void>;
    get(key: string): Promise<string | null>;
    clear(key: string): Promise<void>;
}
export declare class RedisSessionStore implements SessionStore {
    private publisher;
    private getSessionKey;
    private ttl;
    private tools;
    constructor(publisher: RedisPublisher, getSessionKey: (sessionId: string) => string, ttl: number);
    register(sessionId: string): Promise<void>;
    validate(sessionId: string): Promise<boolean>;
    unregister(sessionId: string): Promise<void>;
    getTools(sessionId: string): Tool[] | undefined;
    setTools(sessionId: string, tools: Tool[]): void;
    clearTools(sessionId: string): void;
}
