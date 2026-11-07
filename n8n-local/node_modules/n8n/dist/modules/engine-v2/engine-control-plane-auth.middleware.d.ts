import type { Logger } from '@n8n/backend-common';
import type { EngineConfig } from '@n8n/config';
import type { ActionScope } from '@n8n/engine';
import type { NextFunction, Request, Response } from 'express';
type SyncRequestHandler = (req: Request, res: Response, next: NextFunction) => void;
export declare function createEngineControlPlaneAuthMiddleware(engineConfig: EngineConfig, logger: Logger, requiredScope: ActionScope): SyncRequestHandler;
export {};
