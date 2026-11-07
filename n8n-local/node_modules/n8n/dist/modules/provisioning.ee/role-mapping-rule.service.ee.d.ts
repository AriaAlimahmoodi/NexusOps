import { CreateRoleMappingRuleDto, type ListRoleMappingRuleQueryInput, type PatchRoleMappingRuleInput } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import { ProjectRepository, RoleMappingRuleRepository, RoleRepository } from '@n8n/db';
import { type EntityManager } from '@n8n/typeorm';
import type { z } from 'zod';
import type { UserLike } from '../../events/maps/relay.event-map';
type CreateRoleMappingRuleInput = z.infer<(typeof CreateRoleMappingRuleDto)['schema']>;
export type RoleMappingRuleResponse = {
    id: string;
    expression: string;
    role: string;
    type: 'instance' | 'project';
    order: number;
    projectIds: string[];
    createdAt: string;
    updatedAt: string;
};
export type RoleMappingRuleListResponse = {
    count: number;
    items: RoleMappingRuleResponse[];
};
export declare class RoleMappingRuleService {
    private readonly roleMappingRuleRepository;
    private readonly roleRepository;
    private readonly projectRepository;
    private readonly eventService;
    constructor(roleMappingRuleRepository: RoleMappingRuleRepository, roleRepository: RoleRepository, projectRepository: ProjectRepository, eventService: EventService);
    list(query: ListRoleMappingRuleQueryInput): Promise<RoleMappingRuleListResponse>;
    create(dto: CreateRoleMappingRuleInput, user: UserLike): Promise<RoleMappingRuleResponse>;
    private saveWithOrderRetry;
    patch({ id, dto, userId, userEmail, }: {
        id: string;
        dto: PatchRoleMappingRuleInput;
        userId: string;
        userEmail?: string;
    }): Promise<RoleMappingRuleResponse>;
    delete({ id, userId, userEmail, }: {
        id: string;
        userId: string;
        userEmail?: string;
    }): Promise<RoleMappingRuleResponse>;
    deleteAllOfType(type: 'instance' | 'project', tx?: EntityManager): Promise<number>;
    move({ id, targetIndex, userId, userEmail, }: {
        id: string;
        targetIndex: number;
        userId: string;
        userEmail?: string;
    }): Promise<RoleMappingRuleResponse>;
    private applyOrder;
    private normalizeOrderForType;
    private assertOrderAvailable;
    private toResponse;
}
export {};
