import type { ProjectConflict } from '../../n8n-packages.types';
import type { SerializedProject } from '../../spec/serialized/project.schema';
export interface PreparedProject {
    sourceProjectId: string;
    name: string;
    description?: string;
    icon?: SerializedProject['icon'];
    customTelemetryTags?: SerializedProject['customTelemetryTags'];
}
export type ProjectPlannedAction = 'create' | 'update' | 'skip';
export interface ProjectPlanFields {
    sourceProjectId: string;
    name: string;
    description?: string;
    icon?: SerializedProject['icon'];
    customTelemetryTags?: SerializedProject['customTelemetryTags'];
}
export type ProjectPlanItem = ({
    action: 'create' | 'update';
} & ProjectPlanFields) | ({
    action: 'skip';
    existingName: string;
} & ProjectPlanFields);
export interface ProjectImportPlan {
    items: ProjectPlanItem[];
    conflicts: ProjectConflict[];
}
