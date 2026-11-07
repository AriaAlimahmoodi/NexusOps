import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { User, UserRepository } from '@n8n/db';
import type { IPasswordAuthHandler } from '@n8n/decorators';
import { Constructable } from '@n8n/di';
import { PasswordUtility } from '../../services/password.utility';
export declare class EmailAuthHandler implements IPasswordAuthHandler<User> {
    private readonly userRepository;
    private readonly passwordUtility;
    private readonly eventService;
    private readonly globalConfig;
    readonly metadata: {
        name: string;
        type: 'password';
    };
    readonly userClass: Constructable<User>;
    constructor(userRepository: UserRepository, passwordUtility: PasswordUtility, eventService: EventService, globalConfig: GlobalConfig);
    handleLogin(email: string, password: string): Promise<User | undefined>;
}
