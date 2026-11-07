import { CreateTrustedSourceDto, UpdateTrustedSourceDto } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import { type AuthenticatedRequest } from '@n8n/db';
import { type Capability, type TrustedSource } from '@n8n/inbound-auth';
import type { Response } from 'express';
import { TrustedSourceDiscoveryService } from './trusted-source-discovery.service';
import { TrustedSourceDbStore } from './trusted-source.store';
type TrustedSourceSummary = {
    id: string;
    name: string;
    capabilities: Capability[];
    surfaces: string[];
};
export declare class TrustedSourceController {
    private readonly store;
    private readonly discovery;
    private readonly eventService;
    constructor(store: TrustedSourceDbStore, discovery: TrustedSourceDiscoveryService, eventService: EventService);
    list(): Promise<TrustedSourceSummary[]>;
    get(_req: AuthenticatedRequest, _res: Response, id: string): Promise<TrustedSource>;
    create(req: AuthenticatedRequest, _res: Response, dto: CreateTrustedSourceDto): Promise<TrustedSource>;
    update(req: AuthenticatedRequest, _res: Response, id: string, dto: UpdateTrustedSourceDto): Promise<TrustedSource>;
    delete(req: AuthenticatedRequest, _res: Response, id: string): Promise<void>;
    check(_req: AuthenticatedRequest, _res: Response, id: string): Promise<TrustedSource>;
    private require;
}
export {};
