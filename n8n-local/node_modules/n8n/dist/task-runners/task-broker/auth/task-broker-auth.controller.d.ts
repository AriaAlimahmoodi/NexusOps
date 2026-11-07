import type { AuthlessRequest } from '../../../requests';
import { TaskBrokerAuthService } from './task-broker-auth.service';
export declare class TaskBrokerAuthController {
    private readonly authService;
    constructor(authService: TaskBrokerAuthService);
    createGrantToken(req: AuthlessRequest): Promise<{
        token: string;
    }>;
    validateUpgradeRequest(authHeader: string | undefined): Promise<{
        isValid: boolean;
        statusCode: number;
        reason?: string;
        boundRunnerId?: string;
    }>;
}
