import { UserRepository } from '@n8n/db';
import { RoleService } from '@n8n/backend-services';
export declare class AgentPushRecipientsService {
    private readonly userRepository;
    private readonly roleService;
    constructor(userRepository: UserRepository, roleService: RoleService);
    getProjectReaders(projectId: string): Promise<string[]>;
    getProjectUsersWithScope(projectId: string, scope: 'agent:read' | 'agent:execute'): Promise<string[]>;
}
