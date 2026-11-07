import type { ListDataTableQueryDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { ProjectRelationRepository, User } from '@n8n/db';
import { RoleService } from '@n8n/backend-services';
import { DataTableRepository } from './data-table.repository';
export declare class DataTableAggregateService {
    private readonly dataTableRepository;
    private readonly projectRelationRepository;
    private readonly roleService;
    private readonly logger;
    constructor(dataTableRepository: DataTableRepository, projectRelationRepository: ProjectRelationRepository, roleService: RoleService, logger: Logger);
    start(): Promise<void>;
    shutdown(): Promise<void>;
    getManyAndCount(user: User, options: ListDataTableQueryDto): Promise<{
        count: number;
        data: import("./data-table.entity").DataTable[];
    }>;
}
