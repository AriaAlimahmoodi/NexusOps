import { packageRequirementConsumerSchema } from '@n8n/api-types';
import { z } from 'zod';
export declare const packageCredentialRequirementSchema: z.ZodEffects<z.ZodObject<{
    usedBy: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["workflow", "agent"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "agent" | "workflow";
        id: string;
    }, {
        kind: "agent" | "workflow";
        id: string;
    }>, "many">;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
    type?: string | undefined;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
    type?: string | undefined;
}>, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
    type?: string | undefined;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
    type?: string | undefined;
}>;
export declare const packageDataTableRequirementSchema: z.ZodObject<{
    usedBy: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["workflow", "agent"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "agent" | "workflow";
        id: string;
    }, {
        kind: "agent" | "workflow";
        id: string;
    }>, "many">;
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name: string;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name: string;
}>;
export declare const packageWorkflowRequirementSchema: z.ZodObject<{
    usedBy: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["workflow", "agent"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "agent" | "workflow";
        id: string;
    }, {
        kind: "agent" | "workflow";
        id: string;
    }>, "many">;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
}>;
export declare const packageAgentRequirementSchema: z.ZodObject<{
    usedBy: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["workflow", "agent"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "agent" | "workflow";
        id: string;
    }, {
        kind: "agent" | "workflow";
        id: string;
    }>, "many">;
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    id: string;
    name?: string | undefined;
}>;
export declare const packageTagRequirementSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    usedBy: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
    } & {
        kind: z.ZodLiteral<"workflow">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        kind: "workflow";
    }, {
        id: string;
        kind: "workflow";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    usedBy: {
        id: string;
        kind: "workflow";
    }[];
}, {
    id: string;
    name: string;
    usedBy: {
        id: string;
        kind: "workflow";
    }[];
}>;
export declare const packageNodeTypeRequirementSchema: z.ZodObject<{
    usedBy: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["workflow", "agent"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "agent" | "workflow";
        id: string;
    }, {
        kind: "agent" | "workflow";
        id: string;
    }>, "many">;
    type: z.ZodString;
    typeVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    type: string;
    typeVersion: number;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    type: string;
    typeVersion: number;
}>;
export declare const packageVariableRequirementSchema: z.ZodObject<{
    usedBy: z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<["workflow", "agent"]>;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "agent" | "workflow";
        id: string;
    }, {
        kind: "agent" | "workflow";
        id: string;
    }>, "many">;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    name: string;
}, {
    usedBy: {
        kind: "agent" | "workflow";
        id: string;
    }[];
    name: string;
}>;
export declare const packageRequirementsSchema: z.ZodObject<{
    credentials: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        usedBy: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["workflow", "agent"]>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "agent" | "workflow";
            id: string;
        }, {
            kind: "agent" | "workflow";
            id: string;
        }>, "many">;
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }>, "many">>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }[] | undefined, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }[] | undefined>;
    dataTables: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        usedBy: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["workflow", "agent"]>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "agent" | "workflow";
            id: string;
        }, {
            kind: "agent" | "workflow";
            id: string;
        }>, "many">;
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name: string;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name: string;
    }>, "many">>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name: string;
    }[] | undefined, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name: string;
    }[] | undefined>;
    workflows: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        usedBy: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["workflow", "agent"]>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "agent" | "workflow";
            id: string;
        }, {
            kind: "agent" | "workflow";
            id: string;
        }>, "many">;
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }>, "many">>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined>;
    agents: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        usedBy: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["workflow", "agent"]>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "agent" | "workflow";
            id: string;
        }, {
            kind: "agent" | "workflow";
            id: string;
        }>, "many">;
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }>, "many">>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined>;
    variables: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        usedBy: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["workflow", "agent"]>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "agent" | "workflow";
            id: string;
        }, {
            kind: "agent" | "workflow";
            id: string;
        }>, "many">;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        name: string;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        name: string;
    }>, "many">>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        name: string;
    }[] | undefined, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        name: string;
    }[] | undefined>;
    tags: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        usedBy: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
        } & {
            kind: z.ZodLiteral<"workflow">;
        }, "strip", z.ZodTypeAny, {
            id: string;
            kind: "workflow";
        }, {
            id: string;
            kind: "workflow";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        usedBy: {
            id: string;
            kind: "workflow";
        }[];
    }, {
        id: string;
        name: string;
        usedBy: {
            id: string;
            kind: "workflow";
        }[];
    }>, "many">>, {
        id: string;
        name: string;
        usedBy: {
            id: string;
            kind: "workflow";
        }[];
    }[] | undefined, {
        id: string;
        name: string;
        usedBy: {
            id: string;
            kind: "workflow";
        }[];
    }[] | undefined>;
    nodeTypes: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
        usedBy: z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<["workflow", "agent"]>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            kind: "agent" | "workflow";
            id: string;
        }, {
            kind: "agent" | "workflow";
            id: string;
        }>, "many">;
        type: z.ZodString;
        typeVersion: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        type: string;
        typeVersion: number;
    }, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        type: string;
        typeVersion: number;
    }>, "many">>, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        type: string;
        typeVersion: number;
    }[] | undefined, {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        type: string;
        typeVersion: number;
    }[] | undefined>;
}, "strip", z.ZodTypeAny, {
    credentials?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }[] | undefined;
    dataTables?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name: string;
    }[] | undefined;
    workflows?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined;
    agents?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined;
    variables?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        name: string;
    }[] | undefined;
    tags?: {
        id: string;
        name: string;
        usedBy: {
            id: string;
            kind: "workflow";
        }[];
    }[] | undefined;
    nodeTypes?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        type: string;
        typeVersion: number;
    }[] | undefined;
}, {
    credentials?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
        type?: string | undefined;
    }[] | undefined;
    dataTables?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name: string;
    }[] | undefined;
    workflows?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined;
    agents?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        id: string;
        name?: string | undefined;
    }[] | undefined;
    variables?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        name: string;
    }[] | undefined;
    tags?: {
        id: string;
        name: string;
        usedBy: {
            id: string;
            kind: "workflow";
        }[];
    }[] | undefined;
    nodeTypes?: {
        usedBy: {
            kind: "agent" | "workflow";
            id: string;
        }[];
        type: string;
        typeVersion: number;
    }[] | undefined;
}>;
export type PackageRequirementConsumer = z.infer<typeof packageRequirementConsumerSchema>;
export type PackageCredentialRequirement = z.infer<typeof packageCredentialRequirementSchema>;
export type PackageDataTableRequirement = z.infer<typeof packageDataTableRequirementSchema>;
export type PackageWorkflowRequirement = z.infer<typeof packageWorkflowRequirementSchema>;
export type PackageAgentRequirement = z.infer<typeof packageAgentRequirementSchema>;
export type PackageTagRequirement = z.infer<typeof packageTagRequirementSchema>;
export type PackageVariableRequirement = z.infer<typeof packageVariableRequirementSchema>;
export type PackageNodeTypeRequirement = z.infer<typeof packageNodeTypeRequirementSchema>;
export type PackageRequirements = z.infer<typeof packageRequirementsSchema>;
