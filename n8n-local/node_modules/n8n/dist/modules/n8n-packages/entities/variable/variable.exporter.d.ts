import { SharedWorkflowRepository } from '@n8n/db';
import { VariablesService } from '../../../../environments.ee/variables/variables.service.ee';
import { VariableSerializer } from './variable.serializer';
import type { VariableExportRequest, VariableExportResult } from './variable.types';
export declare class VariableExporter {
    private readonly variablesService;
    private readonly sharedWorkflowRepository;
    private readonly variableSerializer;
    constructor(variablesService: VariablesService, sharedWorkflowRepository: SharedWorkflowRepository, variableSerializer: VariableSerializer);
    export(request: VariableExportRequest): Promise<VariableExportResult>;
    private serializeOrBlock;
    private resolveRequirements;
    private resolveWorkflowProjects;
    private assertNoBundledVariableCollision;
    private hasDirectoryCollision;
}
