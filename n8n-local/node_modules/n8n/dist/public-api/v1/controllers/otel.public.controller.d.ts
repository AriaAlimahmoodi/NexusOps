import { OtelSettingsPublicDto, OtelSettingsQueryPublicDto, OtelTestTraceRequestPublicDto, OtelTestTraceResultPublicDto, UpdateOtelSettingsPublicDto } from '@n8n/api-types';
import { ModuleRegistry } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { OtelSettingsService } from '../../../modules/otel/otel-settings.service';
import { OtelService } from '../../../modules/otel/otel.service';
import { Publisher } from '../../../scaling/pubsub/publisher.service';
export declare class OtelPublicController {
    private readonly settingsService;
    private readonly otelService;
    private readonly moduleRegistry;
    private readonly publisher;
    constructor(settingsService: OtelSettingsService, otelService: OtelService, moduleRegistry: ModuleRegistry, publisher: Publisher);
    getOtelSettings(_req: AuthenticatedRequest, _res: Response, _query: OtelSettingsQueryPublicDto): Promise<OtelSettingsPublicDto>;
    updateOtelSettings(_req: AuthenticatedRequest, _res: Response, body: UpdateOtelSettingsPublicDto, _query: OtelSettingsQueryPublicDto): Promise<OtelSettingsPublicDto>;
    testOtelTrace(_req: AuthenticatedRequest, _res: Response, body: OtelTestTraceRequestPublicDto, _query: OtelSettingsQueryPublicDto): Promise<OtelTestTraceResultPublicDto>;
}
