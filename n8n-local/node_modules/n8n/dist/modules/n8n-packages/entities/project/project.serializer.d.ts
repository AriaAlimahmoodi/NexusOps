import type { Project } from '@n8n/db';
import { type SerializedProject } from '../../spec/serialized/project.schema';
export declare class ProjectSerializer {
    serialize(project: Project): SerializedProject;
}
