import { CreateVariableRequestDto, UpdateVariableRequestDto } from '@n8n/api-types';
import { LicenseState } from '@n8n/backend-common';
import type { User, Variables } from '@n8n/db';
import { VariablesRepository } from '@n8n/db';
import { Scope } from '@n8n/permissions';
import { CacheService, EventService } from '@n8n/backend-services';
import { ProjectService } from '../../services/project.service.ee';
export declare class VariablesService {
    private readonly cacheService;
    private readonly variablesRepository;
    private readonly eventService;
    private readonly licenseState;
    private readonly projectService;
    constructor(cacheService: CacheService, variablesRepository: VariablesRepository, eventService: EventService, licenseState: LicenseState, projectService: ProjectService);
    private findAll;
    private isAuthorizedForVariable;
    getAllCached(filters?: {
        globalOnly: boolean;
    }): Promise<Variables[]>;
    getCached(id: string): Promise<Variables | null>;
    updateCache(): Promise<void>;
    getAllForUser(user: User, filter?: {
        state?: 'empty';
        projectId?: string | null;
    }): Promise<Variables[]>;
    getForUser(user: User, variableId: string, scope?: Scope): Promise<Variables | null>;
    deleteForUser(user: User, id: string): Promise<void>;
    delete(id: string): Promise<void>;
    deleteByIds(ids: string[]): Promise<void>;
    getRemainingVariableQuota(): Promise<{
        limit: number;
        remaining: number;
    } | null>;
    private canCreateNewVariable;
    validateUniqueVariable(key: string, projectId?: string, id?: string): Promise<void>;
    create(user: User, variable: CreateVariableRequestDto): Promise<Variables>;
    update(user: User, id: string, variable: UpdateVariableRequestDto): Promise<Variables>;
}
