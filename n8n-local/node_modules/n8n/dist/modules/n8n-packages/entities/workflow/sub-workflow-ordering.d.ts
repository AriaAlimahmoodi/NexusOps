import type { PackageWorkflowRequirement } from '../../spec/requirements.schema';
export declare function orderBySubWorkflowDependencies<T extends {
    sourceWorkflowId: string;
}>(workflows: T[], requirements: PackageWorkflowRequirement[] | undefined): T[];
