import { CreateVariablePublicDto, ListVariablesQueryDto, UpdateVariablePublicDto, VariableListPublicDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { VariablesService } from '../../../environments.ee/variables/variables.service.ee';
export declare class VariablesPublicController {
    private readonly variablesService;
    constructor(variablesService: VariablesService);
    getVariables(req: AuthenticatedRequest, _res: Response, query: ListVariablesQueryDto): Promise<VariableListPublicDto>;
    createVariable(req: AuthenticatedRequest, _res: Response, payload: CreateVariablePublicDto): Promise<void>;
    updateVariable(req: AuthenticatedRequest, _res: Response, id: string, payload: UpdateVariablePublicDto): Promise<void>;
    deleteVariable(req: AuthenticatedRequest, _res: Response, id: string): Promise<void>;
}
