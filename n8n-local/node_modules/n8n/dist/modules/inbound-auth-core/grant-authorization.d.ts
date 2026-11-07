import type { ResourcePrincipal } from '@n8n/inbound-auth';
import type { OAuthResourceGrant } from 'n8n-workflow';
import type { WorkflowFinderService } from '../../workflows/workflow-finder.service';
export declare function authorizeAgainstGrant(workflowFinderService: WorkflowFinderService, grant: OAuthResourceGrant, user: ResourcePrincipal): Promise<boolean>;
