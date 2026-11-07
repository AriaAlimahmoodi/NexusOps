export interface DeicticExamples {
    conversationContext: string;
    selectedNodes: string[];
    workflowFallback: string[];
    examples?: string[];
    examplesWithSelection?: string[];
    examplesWithoutSelection?: string[];
    additionalNotes?: string;
    positionalReferences?: string[];
    explicitNameMentions?: string[];
    attributeBasedReferences?: string[];
    dualReferences?: string[];
}
export declare function buildDeicticResolutionPrompt(examples: DeicticExamples): string;
