import type { Request, Response } from 'express';
import { EngineLifecycleEventPushRelay } from './engine-lifecycle-event-push-relay';
export declare class EngineLifecycleEventController {
    private readonly pushRelay;
    constructor(pushRelay: EngineLifecycleEventPushRelay);
    receiveLifecycleEvents(req: Request, res: Response): Promise<void>;
}
