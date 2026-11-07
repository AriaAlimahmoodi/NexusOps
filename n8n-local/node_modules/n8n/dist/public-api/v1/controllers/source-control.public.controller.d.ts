import { PullWorkFolderRequestDto, SourceControlPushRequestPublicDto, SourceControlPushResponsePublicDto, SourceControlStatusPublicDto, SourceControlStatusQueryPublicDto, type SourceControlledFile } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { SourceControlPreferencesService } from '../../../modules/source-control.ee/source-control-preferences.service.ee';
import { SourceControlScopedService } from '../../../modules/source-control.ee/source-control-scoped.service';
import { SourceControlService } from '../../../modules/source-control.ee/source-control.service.ee';
export declare class SourceControlPublicController {
    private readonly sourceControlService;
    private readonly sourceControlPreferencesService;
    private readonly sourceControlScopedService;
    private readonly eventService;
    constructor(sourceControlService: SourceControlService, sourceControlPreferencesService: SourceControlPreferencesService, sourceControlScopedService: SourceControlScopedService, eventService: EventService);
    getSourceControlStatus(req: AuthenticatedRequest, _res: Response, query: SourceControlStatusQueryPublicDto): Promise<SourceControlStatusPublicDto>;
    pushSourceControl(req: AuthenticatedRequest, _res: Response, body: SourceControlPushRequestPublicDto): Promise<SourceControlPushResponsePublicDto>;
    pullSourceControl(req: AuthenticatedRequest, res: Response, body: PullWorkFolderRequestDto): Promise<SourceControlledFile[] | undefined>;
}
