import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import { z } from 'zod';
export interface ChatRequest extends IncomingMessage {
    url: string;
    query: {
        sessionId: string;
        executionId: string;
        isPublic?: boolean;
        token?: string;
    };
    ws: WebSocket;
}
export type Session = {
    connection: WebSocket;
    executionId: string;
    sessionId: string;
    intervalId: NodeJS.Timeout;
    nodeWaitingForChatResponse?: string;
    isPublic: boolean;
    isProcessing: boolean;
    lastHeartbeat?: number;
};
export declare const chatMessageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    action: z.ZodLiteral<"sendMessage">;
    chatInput: z.ZodString;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        data: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: string;
        data: string;
    }, {
        name: string;
        type: string;
        data: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    action: "sendMessage";
    chatInput: string;
    files?: {
        name: string;
        type: string;
        data: string;
    }[] | undefined;
}, {
    sessionId: string;
    action: "sendMessage";
    chatInput: string;
    files?: {
        name: string;
        type: string;
        data: string;
    }[] | undefined;
}>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
