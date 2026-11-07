import { ConflictError } from '@n8n/errors';
export declare class SkillNameTakenError extends ConflictError {
    readonly skillName: string;
    constructor(skillName: string);
}
export declare function skillNameTakenToolMessage(skillName: string): string;
