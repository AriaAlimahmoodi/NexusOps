import { WithStringId } from './abstract-entity';
import type { Project } from './project';
export declare class Variables extends WithStringId {
    key: string;
    type: string;
    value: string;
    project: Project | null;
}
