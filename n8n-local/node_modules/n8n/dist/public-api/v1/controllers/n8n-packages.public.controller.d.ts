import { ExportPackageRequestDto, ImportPackageRequestDto, ImportPackageSelectionRequestDto } from '@n8n/api-types';
import { EventService } from '@n8n/backend-services';
import type { AuthenticatedRequest } from '@n8n/db';
import { type BinaryResult } from '@n8n/decorators';
import type { Response } from 'express';
import { N8nPackagesService } from '../../../modules/n8n-packages/n8n-packages.service';
import type { ImportResult } from '../../../modules/n8n-packages/n8n-packages.types';
export declare class N8nPackagesPublicController {
    private readonly n8nPackagesService;
    private readonly eventService;
    constructor(n8nPackagesService: N8nPackagesService, eventService: EventService);
    importPackage(req: AuthenticatedRequest, _res: Response, body: ImportPackageRequestDto): Promise<ImportResult>;
    importPackageSelection(req: AuthenticatedRequest, _res: Response, body: ImportPackageSelectionRequestDto): Promise<ImportResult>;
    exportPackage(req: AuthenticatedRequest, _res: Response, body: ExportPackageRequestDto): Promise<BinaryResult>;
}
