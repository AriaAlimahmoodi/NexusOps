import type { Tool } from '@langchain/core/tools';
import type { SessionStore } from './SessionStore';
export declare class InMemorySessionStore implements SessionStore {
    private sessions;
    private tools;
    register(sessionId: string): Promise<void>;
    validate(sessionId: string): Promise<boolean>;
    unregister(sessionId: string): Promise<void>;
    getTools(sessionId: string): Tool[] | undefined;
    setTools(sessionId: string, tools: Tool[]): void;
    clearTools(sessionId: string): void;
}
