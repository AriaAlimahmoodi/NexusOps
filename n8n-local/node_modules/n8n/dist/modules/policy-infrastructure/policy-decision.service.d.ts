import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import type { EnforcementPoint, PolicyDecision } from '@n8n/decorators';
import { PolicyCheckMetadata } from '@n8n/decorators';
import type { PolicyActor, PolicyContext, PolicyEnforcementBackend } from '../../policy/policy-enforcement-backend';
export declare function withDeadline<T>(start: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T>;
export declare class PolicyDecisionService implements PolicyEnforcementBackend {
    private readonly logger;
    private readonly checkMetadata;
    private readonly eventService;
    constructor(logger: Logger, checkMetadata: PolicyCheckMetadata, eventService: EventService);
    enforce<Point extends EnforcementPoint>(point: Point, context: PolicyContext<Point>, actor: PolicyActor): Promise<PolicyDecision>;
    evaluate<Point extends EnforcementPoint>(point: Point, context: PolicyContext<Point>): Promise<PolicyDecision>;
    hasChecksFor(point: EnforcementPoint): boolean;
    private audit;
    private runChecks;
    private runnersFor;
}
