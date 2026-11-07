import type { CreatePromotionConnectionDto, PromotionApplyConfigPublicDto, PromotionConnectionProjectListPublicDto, PromotionConnectionProjectPublicDto, PromotionConnectionPublicDto, PromotionDirection, PromotionPromoteConfigPublicDto, UpdatePromotionConnectionDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ProjectRepository, TransactionRunner, type User } from '@n8n/db';
import type { PromotionConfig } from './database/entities/promotion-config.entity';
import type { PromotionConnection } from './database/entities/promotion-connection.entity';
import { PromotionConfigRepository } from './database/repositories/promotion-config.repository';
import { PromotionConnectionProjectRepository } from './database/repositories/promotion-connection-project.repository';
import { PromotionConnectionRepository, type PromotionConnectionFilter } from './database/repositories/promotion-connection.repository';
import { PromotionProvidersService } from './promotion-providers.service';
import { PromotionWorkingDirectoryService } from './promotion-working-directory.service';
import { PromotionsGitService } from './promotions-git.service';
import type { ResolvedPromotionConfig } from './promotions.types';
export type PromotionConfigWrite = {
    config: ResolvedPromotionConfig;
    name?: string;
};
export type PromotionApplyConfigWrite = PromotionConfigWrite & {
    config: {
        direction: 'apply';
    };
};
export type PromotionPromoteConfigWrite = PromotionConfigWrite & {
    config: {
        direction: 'promote';
    };
};
type ManageProjectLinkOptions = {
    user: User;
    connectionId: string;
    projectId: string;
};
export declare class PromotionConnectionsService {
    private readonly connectionRepository;
    private readonly configRepository;
    private readonly linkRepository;
    private readonly projectRepository;
    private readonly providersService;
    private readonly gitService;
    private readonly workingDirectory;
    private readonly txRunner;
    private readonly logger;
    constructor(connectionRepository: PromotionConnectionRepository, configRepository: PromotionConfigRepository, linkRepository: PromotionConnectionProjectRepository, projectRepository: ProjectRepository, providersService: PromotionProvidersService, gitService: PromotionsGitService, workingDirectory: PromotionWorkingDirectoryService, txRunner: TransactionRunner, logger: Logger);
    create(input: CreatePromotionConnectionDto): Promise<PromotionConnectionPublicDto>;
    findOne(id: string): Promise<PromotionConnectionPublicDto>;
    list(offset: number, limit: number, filter: PromotionConnectionFilter): Promise<{
        count: number;
        data: {
            id: string;
            name: string;
            scope: "instance" | "projects";
            target: {
                schemaVersion: 1;
                remoteUrl: string;
                repositoryPath?: string | undefined;
            };
            provider: {
                id: string;
                name: string;
                type: "git" | "gitlab";
                authType: "ssh-key" | "token";
                createdAt: string;
                updatedAt: string;
            };
            createdAt: string;
            updatedAt: string;
            configs: {
                apply?: {
                    id: string;
                    name: string;
                    createdAt: string;
                    updatedAt: string;
                    settings: {
                        schemaVersion: 1;
                        branchName: string;
                    };
                } | undefined;
                promote?: {
                    id: string;
                    name: string;
                    createdAt: string;
                    updatedAt: string;
                    settings: {
                        schemaVersion: 1;
                        baseBranchName: string;
                        createBranchOnPromotion: boolean;
                    };
                } | undefined;
            };
        }[];
    }>;
    update(id: string, input: UpdatePromotionConnectionDto): Promise<PromotionConnectionPublicDto>;
    delete(id: string): Promise<void>;
    upsertConfig(connectionId: string, write: PromotionApplyConfigWrite): Promise<PromotionApplyConfigPublicDto>;
    upsertConfig(connectionId: string, write: PromotionPromoteConfigWrite): Promise<PromotionPromoteConfigPublicDto>;
    deleteConfig(connectionId: string, direction: PromotionDirection): Promise<void>;
    listProjects(id: string): Promise<PromotionConnectionProjectListPublicDto>;
    addProject({ user, connectionId, projectId, }: ManageProjectLinkOptions): Promise<PromotionConnectionProjectPublicDto>;
    removeProject({ user, connectionId, projectId }: ManageProjectLinkOptions): Promise<void>;
    getEntity(id: string): Promise<PromotionConnection>;
    toPublic(connection: PromotionConnection, configs: PromotionConfig[]): Promise<PromotionConnectionPublicDto>;
    private toSummary;
    private connectionFields;
    private toConfigsPublic;
    private toConfigsSummary;
    private toConfigPublic;
    private configFields;
    private configSummaryFields;
    private checkoutStateFor;
    private insertConfig;
    private replaceConfig;
    private assertLinkableScope;
    private assertProjectAccess;
    private assertProjectIsTeam;
    private linkedElsewhere;
    private purgeCache;
}
export {};
