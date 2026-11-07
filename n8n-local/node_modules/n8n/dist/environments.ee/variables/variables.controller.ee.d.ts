import { CreateVariableRequestDto, UpdateVariableRequestDto, VariableListRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { VariablesService } from './variables.service.ee';
export declare class VariablesController {
    private readonly variablesService;
    constructor(variablesService: VariablesService);
    getVariables(req: AuthenticatedRequest, _res: unknown, query: VariableListRequestDto): Promise<import("@n8n/db").Variables[]>;
    createVariable(req: AuthenticatedRequest, _res: Response, payload: CreateVariableRequestDto): Promise<import("@n8n/db").Variables>;
    getVariable(req: AuthenticatedRequest<{
        id: string;
    }>): Promise<import("@n8n/db").Variables>;
    updateVariable(req: AuthenticatedRequest<{
        id: string;
    }>, _res: Response, payload: UpdateVariableRequestDto): Promise<import("@n8n/db").Variables>;
    deleteVariable(req: AuthenticatedRequest<{
        id: string;
    }>): Promise<boolean>;
}
