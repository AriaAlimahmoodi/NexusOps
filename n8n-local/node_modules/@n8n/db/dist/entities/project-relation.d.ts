import { WithTimestamps } from './abstract-entity';
import { Project } from './project';
import { Role } from './role';
import { User } from './user';
export declare class ProjectRelation extends WithTimestamps {
    role: Role;
    user: User;
    userId: string;
    project: Project;
    projectId: string;
}
