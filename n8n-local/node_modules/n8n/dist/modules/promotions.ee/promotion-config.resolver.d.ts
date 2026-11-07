import type { PromotionDirection } from '@n8n/api-types';
import { ProjectRepository } from '@n8n/db';
import { PromotionConfigRepository } from './database/repositories/promotion-config.repository';
import { PromotionConnectionProjectRepository } from './database/repositories/promotion-connection-project.repository';
import { PromotionConnectionRepository } from './database/repositories/promotion-connection.repository';
import type { PromotionOperationInput } from './promotions.types';
export declare class PromotionConfigResolver {
    private readonly configRepository;
    private readonly connectionRepository;
    private readonly linkRepository;
    private readonly projectRepository;
    constructor(configRepository: PromotionConfigRepository, connectionRepository: PromotionConnectionRepository, linkRepository: PromotionConnectionProjectRepository, projectRepository: ProjectRepository);
    resolveForConnection(connectionId: string, direction: PromotionDirection): Promise<PromotionOperationInput>;
    resolveForProject(projectId: string, direction: PromotionDirection): Promise<PromotionOperationInput>;
    private toOperationInput;
}
