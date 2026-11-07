import { TestOtelTraceDto, UpdateOtelSettingsDto } from '@n8n/api-types';
import { ModuleRegistry } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import { OtelLifecycleHandler } from './otel-lifecycle-handler';
import { OtelSettingsService } from './otel-settings.service';
import { OtelService } from './otel.service';
import { Publisher } from '../../scaling/pubsub/publisher.service';
export declare class OtelSettingsController {
    private readonly otelSettingsService;
    private readonly otelService;
    private readonly otelLifecycleHandler;
    private readonly moduleRegistry;
    private readonly publisher;
    constructor(otelSettingsService: OtelSettingsService, otelService: OtelService, otelLifecycleHandler: OtelLifecycleHandler, moduleRegistry: ModuleRegistry, publisher: Publisher);
    getSettings(_req: AuthenticatedRequest): import("./otel-settings.service").OtelSettingsResponse;
    updateSettings(_req: AuthenticatedRequest, _res: Response, dto: UpdateOtelSettingsDto): Promise<import("./otel-settings.service").OtelSettingsResponse>;
    testTrace(_req: AuthenticatedRequest, _res: Response, dto: TestOtelTraceDto): Promise<import("./otel.service").OtelTestTraceResult>;
}
