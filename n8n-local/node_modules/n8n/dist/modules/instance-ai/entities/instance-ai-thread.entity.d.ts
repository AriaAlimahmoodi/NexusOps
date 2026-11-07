import { WithTimestamps, Project } from '@n8n/db';
export declare class InstanceAiThread extends WithTimestamps {
    id: string;
    resourceId: string;
    project: Project;
    projectId: string;
    title: string;
    metadata: Record<string, unknown> | null;
}
