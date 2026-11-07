import { PaginationDto, WorkflowHistoryVersionsByIdsDto, UpdateWorkflowHistoryVersionDto, WorkflowPublishTimelineQueryDto } from '@n8n/api-types';
import { AuthenticatedRequest } from '@n8n/db';
import { WorkflowHistoryRequest } from '../../requests';
import { WorkflowHistoryService } from './workflow-history.service';
export declare class WorkflowHistoryController {
    private readonly historyService;
    constructor(historyService: WorkflowHistoryService);
    getList(req: WorkflowHistoryRequest.GetList, _res: Response, query: PaginationDto): Promise<Omit<import("@n8n/db").WorkflowHistory, "connections" | "nodeGroups" | "nodes">[]>;
    getVersion(req: WorkflowHistoryRequest.GetVersion): Promise<import("@n8n/db").WorkflowHistory>;
    getVersionsByIds(req: WorkflowHistoryRequest.GetList, _res: Response, body: WorkflowHistoryVersionsByIdsDto): Promise<{
        versions: {
            versionId: string;
            createdAt: Date;
        }[];
    }>;
    getPublishTimeline(req: WorkflowHistoryRequest.GetList, _res: Response, query: WorkflowPublishTimelineQueryDto): Promise<{
        id: number;
        workflowId: string;
        versionId: string | null;
        event: "activated" | "deactivated";
        createdAt: Date;
        user: import("@n8n/db").User | null;
        versionName: string | null;
    }[]>;
    updateVersion(req: AuthenticatedRequest<{
        workflowId: string;
        versionId: string;
    }>, _res: Response, workflowId: string, versionId: string, body: UpdateWorkflowHistoryVersionDto): Promise<void>;
}
