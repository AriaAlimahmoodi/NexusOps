import { Logger } from '@n8n/backend-common';
import { User } from '@n8n/db';
import type { AuthType, IAuthHandler, IPasswordAuthHandler } from '@n8n/decorators';
import { AuthHandlerEntryMetadata } from '@n8n/decorators';
export declare class AuthHandlerRegistry {
    private readonly authHandlerEntryMetadata;
    private readonly logger;
    private handlerMap;
    constructor(authHandlerEntryMetadata: AuthHandlerEntryMetadata, logger: Logger);
    init(): Promise<void>;
    private isPasswordAuthHandler;
    get(authMethod: string, type: 'password'): IPasswordAuthHandler<User> | undefined;
    get(authMethod: string, type: AuthType): IAuthHandler<User> | undefined;
    has(authMethod: string): boolean;
}
