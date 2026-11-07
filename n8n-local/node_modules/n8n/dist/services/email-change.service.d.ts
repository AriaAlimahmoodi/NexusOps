import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import { MfaService } from '../mfa/mfa.service';
import { PasswordUtility } from '../services/password.utility';
import { UserService } from '../services/user.service';
export declare class EmailChangeService {
    private readonly logger;
    private readonly userService;
    private readonly mfaService;
    private readonly passwordUtility;
    private readonly globalConfig;
    constructor(logger: Logger, userService: UserService, mfaService: MfaService, passwordUtility: PasswordUtility, globalConfig: GlobalConfig);
    isManagedByEnv(user: User): boolean;
    assertMayApplyEmailChange(user: User): Promise<void>;
    assertMayRequestEmailChange(user: User, { currentPassword, mfaCode }: {
        currentPassword?: string;
        mfaCode?: string;
    }): Promise<void>;
    private isAuthIdentityActive;
}
