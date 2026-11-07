export interface SkillInstructionEdit {
    oldText: string;
    newText: string;
}
export declare function applySkillInstructionEdits(instructions: string, edits: SkillInstructionEdit[]): string;
