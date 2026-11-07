import type { OAuthResourceGrant } from 'n8n-workflow';
import type { ProtectedResource } from '@n8n/backend-services/auth';
import type { WorkflowFinderService } from '../../workflows/workflow-finder.service';
export declare function triggerResourceGate(workflowFinderService: WorkflowFinderService, grant: OAuthResourceGrant): Pick<ProtectedResource, 'getGrant' | 'authorize'>;
