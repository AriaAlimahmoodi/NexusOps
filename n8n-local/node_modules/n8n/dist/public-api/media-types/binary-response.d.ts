import type { BinaryResponse, SuccessStatus } from '@n8n/decorators';
import type { Response } from 'express';
export declare function sendBinaryResponse(res: Response, binaryResponse: BinaryResponse, successStatus: SuccessStatus, routeName: string, result: unknown): Promise<void>;
