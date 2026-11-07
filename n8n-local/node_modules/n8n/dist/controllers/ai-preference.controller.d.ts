import { AiPreferenceListQueryDto, AiPreferenceRequestDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { AiPreferenceService } from '../services/ai-preference.service';
export declare class AiPreferenceController {
    private readonly aiPreferenceService;
    constructor(aiPreferenceService: AiPreferenceService);
    getPreferences(req: AuthenticatedRequest, _res: Response, query: AiPreferenceListQueryDto): Promise<import("@n8n/api-types").AiPreferenceListDto>;
    countPreferences(req: AuthenticatedRequest): Promise<import("@n8n/api-types").AiPreferenceCountDto>;
    createPreference(req: AuthenticatedRequest, _res: Response, payload: AiPreferenceRequestDto): Promise<import("@n8n/api-types").AiPreferenceDto>;
    updatePreference(req: AuthenticatedRequest<{
        id: string;
    }>, _res: Response, payload: AiPreferenceRequestDto): Promise<import("@n8n/api-types").AiPreferenceDto>;
    deletePreference(req: AuthenticatedRequest<{
        id: string;
    }>): Promise<boolean>;
}
