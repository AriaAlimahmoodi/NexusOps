import { GlobalConfig } from '@n8n/config';
import { TagService } from '../../../../services/tag.service';
import type { ReferencingWorkflow, TagImportPlan, TagImportRequest } from './tag.types';
import type { ImportContext } from '../../n8n-packages.types';
export declare class TagImporter {
    private readonly tagService;
    private readonly globalConfig;
    constructor(tagService: TagService, globalConfig: GlobalConfig);
    plan(context: ImportContext, request: TagImportRequest, appliedWorkflows: ReferencingWorkflow[]): Promise<TagImportPlan>;
    apply(context: ImportContext, plan: TagImportPlan): Promise<void>;
}
