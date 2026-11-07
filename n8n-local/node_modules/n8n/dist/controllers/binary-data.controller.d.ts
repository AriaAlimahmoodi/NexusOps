import { BinaryDataQueryDto, BinaryDataSignedQueryDto } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import { Request, Response } from 'express';
import { BinaryDataService } from 'n8n-core';
import { BinaryDataAccessService } from '../binary-data/binary-data-access.service';
export declare class BinaryDataController {
    private readonly binaryDataService;
    private readonly binaryDataAccessService;
    constructor(binaryDataService: BinaryDataService, binaryDataAccessService: BinaryDataAccessService);
    get(req: AuthenticatedRequest, res: Response, { id: binaryDataId, action, fileName, mimeType }: BinaryDataQueryDto): Promise<import("stream").Readable | Response<any, Record<string, any>>>;
    getSigned(_: Request, res: Response, { token }: BinaryDataSignedQueryDto): Promise<import("stream").Readable | Response<any, Record<string, any>>>;
    private validateBinaryDataId;
    private setContentHeaders;
}
