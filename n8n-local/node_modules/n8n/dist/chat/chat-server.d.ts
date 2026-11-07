import type { Application } from 'express';
import type { Server as HttpServer } from 'http';
import { ChatService } from './chat-service';
export declare class ChatServer {
    private readonly chatService;
    private readonly wsServer;
    constructor(chatService: ChatService);
    setup(server: HttpServer, app: Application): void;
    private attachToApp;
    shutdown(): void;
}
